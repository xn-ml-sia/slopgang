import UIKit
import MetalKit
import simd

/// Parameters of the simulated decoder. Names follow Modulate's public datamosh controls
/// (intensity, smear, blockSize, melt, heal, threshold, diffusion); values are tuned for a
/// half-second screen transition, not copied from any code.
struct MoshParams {
    var intensity: Float = 1
    var smear: Float = 1.6          // overdriven past the measured motion
    var blockSize: CGFloat = 16     // macroblock, in points
    var melt: Float = 0             // 0 = vectors stop with the motion, 1 = they keep flowing
    var healStart: Float = 0.0      // heal chance per block per frame, held until healFrom...
    var healFrom: Double = 0.6      // ...then ramps (quadratic) to healEnd at the keyframe
    var healEnd: Float = 0.35
    var blockSchedule: [(until: Double, scale: Float)] = [(0.25, 2), (0.5, 1.5), (1, 1)]   // 32 -> 24 -> 16 pt
    var seedScale: CGFloat = 0      // >0: enlarge the tapped plate by this much in the first feedback frame
    var threshold: Float = 1        // SAD gain per pixel needed to accept a vector
    var diffusion: Float = 0.15
    var duration: Double = 0.52
}

/// How the new screen enters the input frame. Its motion is what drags the old pixels.
enum MoshMotion {
    case grow(from: CGRect, via: CGRect) // card grows from the tapped plate to the detail media rect, then full screen
    case settle(scale: CGFloat) // full-screen new frame zooms from `scale` to 1
}

/// CPU block matching between consecutive low-res input frames, two levels (coarse then refine),
/// like an encoder's hierarchical motion search. Output: one vector per macroblock in uv units,
/// pointing to where the block's content was in the previous frame.
nonisolated final class BlockMatcher: @unchecked Sendable {   // used only on MoshView.matchQueue
    let w: Int, h: Int, b: Int, gw: Int, gh: Int
    private let sizePt: CGSize
    private let oldGray: CGImage?
    private let newGray: CGImage?
    private var prev: [UInt8]?
    private var lastVectors: [SIMD2<Float>]

    init(size: CGSize, blockPt: CGFloat, old: UIImage, new: UIImage) {
        sizePt = size
        let scale: CGFloat = 0.25              // motion at quarter resolution
        w = max(8, Int(size.width * scale)); h = max(8, Int(size.height * scale))
        b = max(2, Int(blockPt * scale))
        gw = (w + b - 1) / b; gh = (h + b - 1) / b
        // Downscale both screens to the motion grid once; per-frame renders then touch ~1/16 of the pixels.
        oldGray = Self.small(old.cgImage, w, h); newGray = Self.small(new.cgImage, w, h)
        lastVectors = Array(repeating: .zero, count: gw * gh)
    }

    private static func small(_ img: CGImage?, _ w: Int, _ h: Int) -> CGImage? {
        guard let img, let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w,
                                           space: CGColorSpaceCreateDeviceGray(), bitmapInfo: CGImageAlphaInfo.none.rawValue) else { return nil }
        ctx.interpolationQuality = .medium
        ctx.draw(img, in: CGRect(x: 0, y: 0, width: w, height: h))
        return ctx.makeImage()
    }

    /// Renders the low-res grey input frame: old screen, new screen as a card in `card` (points).
    func frame(card: CGRect) -> [UInt8] {
        var px = [UInt8](repeating: 0, count: w * h)
        px.withUnsafeMutableBytes { buf in
            guard let ctx = CGContext(data: buf.baseAddress, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w,
                                      space: CGColorSpaceCreateDeviceGray(), bitmapInfo: CGImageAlphaInfo.none.rawValue) else { return }
            ctx.interpolationQuality = .low
            let sx = CGFloat(w) / sizePt.width, sy = CGFloat(h) / sizePt.height
            if let o = oldGray { ctx.draw(o, in: CGRect(x: 0, y: 0, width: w, height: h)) }
            // CoreGraphics is bottom-left; flip the card's y.
            let r = CGRect(x: card.minX * sx, y: CGFloat(h) - card.maxY * sy, width: card.width * sx, height: card.height * sy)
            if let n = newGray { ctx.draw(n, in: r) }
        }
        return px
    }

    private func half(_ a: [UInt8], _ w: Int, _ h: Int) -> [UInt8] {
        let hw = w / 2, hh = h / 2
        var o = [UInt8](repeating: 0, count: hw * hh)
        a.withUnsafeBufferPointer { a in o.withUnsafeMutableBufferPointer { o in
            for y in 0..<hh { for x in 0..<hw {
                let i = 2 * y * w + 2 * x
                o[y * hw + x] = UInt8((Int(a[i]) + Int(a[i + 1]) + Int(a[i + w]) + Int(a[i + w + 1])) / 4)
            } }
        } }
        return o
    }

    private func sad(_ cur: [UInt8], _ ref: [UInt8], _ w: Int, _ h: Int, _ x0: Int, _ y0: Int, _ bs: Int, _ dx: Int, _ dy: Int) -> Int {
        cur.withUnsafeBufferPointer { c in ref.withUnsafeBufferPointer { r in sadP(c, r, w, h, x0, y0, bs, dx, dy) } }
    }

    private func sadP(_ cur: UnsafeBufferPointer<UInt8>, _ ref: UnsafeBufferPointer<UInt8>, _ w: Int, _ h: Int, _ x0: Int, _ y0: Int, _ bs: Int, _ dx: Int, _ dy: Int) -> Int {
        var s = 0
        for y in y0..<min(h, y0 + bs) {
            let ry = min(h - 1, max(0, y + dy))
            for x in x0..<min(w, x0 + bs) {
                let rx = min(w - 1, max(0, x + dx))
                s += abs(Int(cur[y * w + x]) - Int(ref[ry * w + rx]))
            }
        }
        return s
    }

    /// Estimates motion from the previous frame to `cur`. `threshold` and `melt` as in MoshParams.
    func estimate(_ cur: [UInt8], threshold: Float, melt: Float) -> [SIMD2<Float>] {
        defer { prev = cur }
        guard let ref = prev else { return lastVectors }
        let cw = w / 2, ch = h / 2
        let c0 = half(cur, w, h), r0 = half(ref, w, h)
        let hb = max(1, b / 2)
        var out = [SIMD2<Float>](repeating: .zero, count: gw * gh)
        for by in 0..<gh { for bx in 0..<gw {
            // Level 0: half resolution, search +-4 (+-8 px at level 1).
            var best = (dx: 0, dy: 0, s: Int.max)
            for dy in -4...4 { for dx in -4...4 {
                let s = sad(c0, r0, cw, ch, bx * hb, by * hb, hb, dx, dy)
                if s < best.s { best = (dx, dy, s) }
            } }
            // Level 1: refine +-1 around the doubled coarse vector.
            var fine = (dx: 0, dy: 0, s: sad(cur, ref, w, h, bx * b, by * b, b, 0, 0))
            let zero = fine.s
            for dy in -1...1 { for dx in -1...1 {
                let ddx = best.dx * 2 + dx, ddy = best.dy * 2 + dy
                let s = sad(cur, ref, w, h, bx * b, by * b, b, ddx, ddy)
                if s < fine.s { fine = (ddx, ddy, s) }
            } }
            // Threshold: keep the vector only if it beats "no motion" by enough.
            let gain = Float(zero - fine.s) / Float(b * b)
            let i = by * gw + bx
            var v = gain >= threshold ? SIMD2<Float>(Float(fine.dx) / Float(w), Float(fine.dy) / Float(h)) : .zero
            // Melt: vectors keep flowing after the motion stops.
            if v == .zero { v = lastVectors[i] * melt }
            out[i] = v
        } }
        lastVectors = out
        return out
    }
}

/// MTKView that runs the feedback loop: ping-pong output textures, one displacement pass per frame.
final class MoshView: MTKView, MTKViewDelegate {
    private var queue: MTLCommandQueue?
    private var displacePSO: MTLRenderPipelineState?
    private var presentPSO: MTLRenderPipelineState?
    private var oldTex: MTLTexture?, newTex: MTLTexture?, motionTex: MTLTexture?
    private var ping: [MTLTexture] = []
    private var current = 0
    private var firstFrame = true
    private var matcher: BlockMatcher?
    private var params = MoshParams()
    private var motionKind: MoshMotion = .settle(scale: 1)
    private var start: CFTimeInterval = 0
    private var frameIndex = 0
    private var done: (() -> Void)?
    private var finished = false
    /// Called once the first moshed frame is on screen.
    var onFirstFrame: (() -> Void)?
    private var matchMs = 0.0, matchMax = 0.0, matchCount = 0
    // Motion search runs off the main thread; draw() always uses the newest finished field.
    private let matchQueue = DispatchQueue(label: "org.slopgang.mosh.match", qos: .userInteractive)
    private var latest: [SIMD2<Float>]?
    private var matching = false
    private var fieldLive = true
    private var generation = 0

    init() {
        let dev = MTLCreateSystemDefaultDevice()
        super.init(frame: .zero, device: dev)
        framebufferOnly = false
        colorPixelFormat = .bgra8Unorm
        isPaused = true
        enableSetNeedsDisplay = false
        preferredFramesPerSecond = 60
        delegate = self
        isOpaque = true
        guard let dev, let lib = dev.makeDefaultLibrary() else { return }
        queue = dev.makeCommandQueue()
        func pso(_ frag: String) -> MTLRenderPipelineState? {
            let d = MTLRenderPipelineDescriptor()
            d.vertexFunction = lib.makeFunction(name: "moshVertex")
            d.fragmentFunction = lib.makeFunction(name: frag)
            d.colorAttachments[0].pixelFormat = .bgra8Unorm
            return try? dev.makeRenderPipelineState(descriptor: d)
        }
        displacePSO = pso("moshDisplace")
        presentPSO = pso("moshPresent")
    }
    required init(coder: NSCoder) { fatalError() }

    var isReady: Bool { displacePSO != nil && presentPSO != nil }

    /// Builds a BGRA8 texture by drawing the image into a plain 8-bit buffer. Snapshots can come
    /// back in a wide-colour / extended-range format that MTKTextureLoader fails to decode
    /// (ImageIO error -17102), so the loader is not used.
    private static func texture(_ cg: CGImage, device: MTLDevice) -> MTLTexture? {
        let w = cg.width, h = cg.height
        guard w > 0, h > 0 else { return nil }
        let rowBytes = w * 4
        var bytes = [UInt8](repeating: 0, count: rowBytes * h)
        let ok: Bool = bytes.withUnsafeMutableBytes { buf in
            guard let ctx = CGContext(data: buf.baseAddress, width: w, height: h, bitsPerComponent: 8, bytesPerRow: rowBytes,
                                      space: CGColorSpaceCreateDeviceRGB(),
                                      bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue)
            else { return false }
            ctx.draw(cg, in: CGRect(x: 0, y: 0, width: w, height: h))
            return true
        }
        guard ok else { return nil }
        let d = MTLTextureDescriptor.texture2DDescriptor(pixelFormat: .bgra8Unorm, width: w, height: h, mipmapped: false)
        d.usage = .shaderRead
        guard let t = device.makeTexture(descriptor: d) else { return nil }
        bytes.withUnsafeBytes { t.replace(region: MTLRegionMake2D(0, 0, w, h), mipmapLevel: 0, withBytes: $0.baseAddress!, bytesPerRow: rowBytes) }
        return t
    }

    /// Starts the mosh. Returns false (and never calls `completion`) if it cannot run,
    /// so the caller can fall back to a crossfade.
    @discardableResult
    func run(old: UIImage, new: UIImage, motion: MoshMotion, params p: MoshParams, completion: @escaping () -> Void) -> Bool {
        guard isReady, let dev = device, let o = old.cgImage, let n = new.cgImage,
              bounds.width > 0, bounds.height > 0, drawableSize.width > 0, drawableSize.height > 0,
              let ot = Self.texture(o, device: dev), let nt = Self.texture(n, device: dev) else { return false }
        oldTex = ot
        newTex = nt
        params = p
        motionKind = motion
        let m = BlockMatcher(size: bounds.size, blockPt: p.blockSize, old: old, new: new)
        matcher = m
        let md = MTLTextureDescriptor.texture2DDescriptor(pixelFormat: .rg32Float, width: m.gw, height: m.gh, mipmapped: false)
        md.usage = .shaderRead
        motionTex = dev.makeTexture(descriptor: md)
        let size = drawableSize
        let fd = MTLTextureDescriptor.texture2DDescriptor(pixelFormat: .bgra8Unorm, width: Int(size.width), height: Int(size.height), mipmapped: false)
        fd.usage = [.renderTarget, .shaderRead]
        fd.storageMode = .private
        ping = [dev.makeTexture(descriptor: fd), dev.makeTexture(descriptor: fd)].compactMap { $0 }
        guard motionTex != nil, ping.count == 2 else { return false }
        firstFrame = true
        frameIndex = 0
        finished = false
        done = completion
        // Prime the matcher with the first input frame so the first estimate has a reference.
        generation += 1
        latest = nil
        matching = true
        let gen = generation, c0 = card(at: 0), th = p.threshold, mt = p.melt
        matchQueue.async { [weak self] in
            _ = m.estimate(m.frame(card: c0), threshold: th, melt: mt)
            DispatchQueue.main.async { if self?.generation == gen { self?.matching = false } }
        }
        SGTrace.mark("mosh setup done (textures + matcher prime)")
        start = CACurrentMediaTime()
        isPaused = false
        return true
    }

    /// Stops drawing and drops the textures. Safe to call more than once.
    func cancel() {
        #if DEBUG
        if frameIndex > 0 { print(String(format: "[sg][t] mosh frames %d, motion fields %d, match total %.1f ms (off main), max %.1f ms", frameIndex, matchCount, matchMs, matchMax)) }
        matchMs = 0; matchMax = 0; matchCount = 0
        #endif
        generation += 1
        matching = false
        latest = nil
        #if DEBUG
        #endif
        isPaused = true
        done = nil
        onFirstFrame = nil
        finished = true
        oldTex = nil; newTex = nil; motionTex = nil; ping = []; matcher = nil
    }

    private func easeOutCubic(_ t: Double) -> Double { 1 - pow(1 - min(1, max(0, t)), 3) }

    /// The new screen's rect in the input frame at progress p.
    private func card(at p: Double) -> CGRect {
        let full = bounds
        switch motionKind {
        case .grow(let from, let via):
            func lerp(_ a: CGRect, _ b: CGRect, _ k: CGFloat) -> CGRect {
                CGRect(x: a.minX + (b.minX - a.minX) * k, y: a.minY + (b.minY - a.minY) * k,
                       width: a.width + (b.width - a.width) * k, height: a.height + (b.height - a.height) * k)
            }
            if p < 0.5 { return lerp(from, via, CGFloat(easeOutCubic(p / 0.5))) }
            return lerp(via, full, CGFloat(easeOutCubic((p - 0.5) / 0.3)))
        case .settle(let s):
            let k = CGFloat(easeOutCubic(p / 0.8))
            let sc = s + (1 - s) * k
            let w = full.width * sc, h = full.height * sc
            return CGRect(x: full.midX - w / 2, y: full.midY - h / 2, width: w, height: h)
        }
    }

    func mtkView(_ view: MTKView, drawableSizeWillChange size: CGSize) {}

    func draw(in view: MTKView) {
        guard let queue, let displacePSO, let presentPSO, ping.count == 2,
              let oldTex, let newTex, let motionTex, let matcher,
              let drawable = currentDrawable, let cb = queue.makeCommandBuffer() else {
            // Never spin forever on a missing resource or drawable: end the transition.
            if !finished, CACurrentMediaTime() - start > params.duration + 0.2 {
                finished = true
                isPaused = true
                let d = done; done = nil
                d?()
            }
            return
        }
        let p = min(1, (CACurrentMediaTime() - start) / params.duration)
        let healK = Float(max(0, (p - params.healFrom) / max(0.01, 1 - params.healFrom)))
        let blockScale = params.blockSchedule.first { p < $0.until }?.scale ?? 1
        let sz0 = bounds.size
        var seedFrom = CGRect.zero, seedTo = CGRect.zero
        if params.seedScale > 0, case .grow(let from, _) = motionKind {
            seedFrom = from
            let w = from.width * params.seedScale, h = from.height * params.seedScale
            seedTo = CGRect(x: from.midX - w / 2, y: from.midY - h / 2, width: w, height: h)
        }
        func uv(_ r: CGRect) -> (SIMD2<Float>, SIMD2<Float>) {
            (SIMD2(Float(r.minX / sz0.width), Float(r.minY / sz0.height)), SIMD2(Float(r.width / sz0.width), Float(r.height / sz0.height)))
        }
        let (sfo, sfs) = uv(seedFrom), (sto, sts) = uv(seedTo)
        let keyframe = p >= 1
        let r = card(at: p)

        // Motion estimation between the previous and current input frames.
        if !matching {
            matching = true
            let gen = generation, th = params.threshold, mt = params.melt
            matchQueue.async { [weak self] in
                let tm0 = CACurrentMediaTime()
                let v = matcher.estimate(matcher.frame(card: r), threshold: th, melt: mt)
                let dt = (CACurrentMediaTime() - tm0) * 1000
                DispatchQueue.main.async {
                    guard let self, self.generation == gen else { return }
                    self.latest = v; self.matching = false
                    #if DEBUG
                    self.matchMs += dt; self.matchMax = max(self.matchMax, dt); self.matchCount += 1
                    #endif
                }
            }
        }
        // Each field is applied once; between fields a zero field makes the feedback just hold,
        // so total displacement tracks real motion whatever the match rate is.
        let fresh = latest
        latest = nil
        if fresh != nil || fieldLive {
            fieldLive = fresh != nil
            let vectors = fresh ?? [SIMD2<Float>](repeating: .zero, count: matcher.gw * matcher.gh)
            vectors.withUnsafeBytes { raw in
                motionTex.replace(region: MTLRegionMake2D(0, 0, matcher.gw, matcher.gh), mipmapLevel: 0,
                                  withBytes: raw.baseAddress!, bytesPerRow: matcher.gw * MemoryLayout<SIMD2<Float>>.stride)
            }
        }

        let sz = bounds.size
        var u = Uniforms(
            cardOrigin: SIMD2(Float(r.minX / sz.width), Float(r.minY / sz.height)),
            cardSize: SIMD2(Float(max(1, r.width) / sz.width), Float(max(1, r.height) / sz.height)),
            grid: SIMD2(Float(matcher.gw), Float(matcher.gh)),
            smear: params.smear,
            heal: params.healStart + (params.healEnd - params.healStart) * healK * healK,
            diffusion: params.diffusion,
            intensity: params.intensity,
            seed: Float(frameIndex % 997),
            keyframe: keyframe ? 1 : 0,
            blockScale: blockScale,
            seeding: firstFrame ? 1 : 0,
            seedFromO: sfo, seedFromS: sfs, seedToO: sto, seedToS: sts)
        frameIndex += 1

        // Pass 1: displacement into the next feedback texture.
        let target = ping[1 - current]
        let rp = MTLRenderPassDescriptor()
        rp.colorAttachments[0].texture = target
        rp.colorAttachments[0].loadAction = .dontCare
        rp.colorAttachments[0].storeAction = .store
        if let enc = cb.makeRenderCommandEncoder(descriptor: rp) {
            enc.setRenderPipelineState(displacePSO)
            enc.setFragmentTexture(firstFrame ? oldTex : ping[current], index: 0)   // feedback starts as the old screen
            enc.setFragmentTexture(motionTex, index: 1)
            enc.setFragmentTexture(oldTex, index: 2)
            enc.setFragmentTexture(newTex, index: 3)
            enc.setFragmentBytes(&u, length: MemoryLayout<Uniforms>.stride, index: 0)
            enc.drawPrimitives(type: .triangle, vertexStart: 0, vertexCount: 3)
            enc.endEncoding()
        }
        firstFrame = false
        current = 1 - current

        // Pass 2: show it.
        if let pd = currentRenderPassDescriptor, let enc = cb.makeRenderCommandEncoder(descriptor: pd) {
            enc.setRenderPipelineState(presentPSO)
            enc.setFragmentTexture(target, index: 0)
            enc.drawPrimitives(type: .triangle, vertexStart: 0, vertexCount: 3)
            enc.endEncoding()
        }
        cb.present(drawable)
        if frameIndex == 1, let f = onFirstFrame {
            onFirstFrame = nil
            cb.addCompletedHandler { _ in DispatchQueue.main.async { f() } }
        }
        if keyframe && !finished {
            finished = true
            isPaused = true
            let d = done; done = nil
            cb.addCompletedHandler { _ in DispatchQueue.main.async { d?() } }
        }
        cb.commit()
    }

    /// Must match MoshUniforms in Glitch.metal: float2 x3, float x8, float2 x4 = 88 bytes, 8-byte aligned.
    private struct Uniforms {
        var cardOrigin: SIMD2<Float>
        var cardSize: SIMD2<Float>
        var grid: SIMD2<Float>
        var smear: Float
        var heal: Float
        var diffusion: Float
        var intensity: Float
        var seed: Float
        var keyframe: Float
        var blockScale: Float
        var seeding: Float
        var seedFromO: SIMD2<Float>
        var seedFromS: SIMD2<Float>
        var seedToO: SIMD2<Float>
        var seedToS: SIMD2<Float>
    }
}
