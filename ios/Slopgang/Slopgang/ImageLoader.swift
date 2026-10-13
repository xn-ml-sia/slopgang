import UIKit
import CoreImage
import ImageIO

/// Downloads images (WebP decodes natively on iOS 14+) and computes the mean color with Core Image.
actor ImageLoader {
    static let shared = ImageLoader()
    private var cache: [URL: UIImage] = [:]
    private let ci = CIContext(options: [.workingColorSpace: NSNull()])

    func image(_ url: URL?) async -> UIImage? {
        guard let url else { return nil }
        if let i = cache[url] { return i }
        guard let (d, r) = try? await ArchiveStore.session.data(from: url),
              (r as? HTTPURLResponse)?.statusCode == 200,
              let ready = Self.decode(d) else { return nil }
        cache[url] = ready
        return ready
    }

    /// Decodes with ImageIO into a plain 8-bit bitmap up front. UIImage.preparingForDisplay()
    /// logged "Error -17102 decompressing image" for these WebP files on iOS 27, so it is not used.
    nonisolated static func decode(_ data: Data) -> UIImage? {
        guard let src = CGImageSourceCreateWithData(data as CFData, nil),
              let cg = CGImageSourceCreateImageAtIndex(src, 0, [kCGImageSourceShouldCacheImmediately: true] as CFDictionary)
        else { return nil }
        return UIImage(cgImage: cg)
    }

    /// Mean RGB of the image via CIAreaAverage, returned as HSL (h 0-360, s 0-1, l 0-1).
    func meanHSL(_ img: UIImage) -> (Double, Double, Double)? {
        guard let cg = img.cgImage else { return nil }
        let input = CIImage(cgImage: cg)
        guard let f = CIFilter(name: "CIAreaAverage", parameters: [kCIInputImageKey: input, kCIInputExtentKey: CIVector(cgRect: input.extent)]),
              let out = f.outputImage else { return nil }
        var px = [UInt8](repeating: 0, count: 4)
        ci.render(out, toBitmap: &px, rowBytes: 4, bounds: CGRect(x: 0, y: 0, width: 1, height: 1), format: .RGBA8, colorSpace: nil)
        return Self.rgbToHsl(Double(px[0]) / 255, Double(px[1]) / 255, Double(px[2]) / 255)
    }

    /// Same formula as FeedWall.tsx rgbToHsl.
    static func rgbToHsl(_ r: Double, _ g: Double, _ b: Double) -> (Double, Double, Double) {
        let mx = max(r, g, b), mn = min(r, g, b)
        let l = (mx + mn) / 2
        let d = mx - mn
        guard d > 0 else { return (0, 0, l) }
        let s = d / (1 - abs(2 * l - 1))
        let h: Double
        if mx == r { h = ((g - b) / d + 6).truncatingRemainder(dividingBy: 6) * 60 }
        else if mx == g { h = ((b - r) / d + 2) * 60 }
        else { h = ((r - g) / d + 4) * 60 }
        return (h, min(1, s), l)
    }

    /// Same seeded fallback as the site when a thumbnail fails.
    static func fallbackHSL(_ id: String) -> (Double, Double, Double) {
        let r = SeededRandom(seed: fnv1a("c-" + id))
        return (r.next() * 360, 0.3, 0.3 + r.next() * 0.4)
    }
}

// MARK: - Glitch image loading (broken-JPEG fill-in)

/// Coarse macroblock version of an image: downscaled to `cols` blocks across, colours quantized
/// to `levels` steps per channel. Display it with nearest filtering so the blocks stay hard.
enum Macroblock {
    static func coarse(_ img: UIImage, cols: Int = 18, levels: Int = 6) -> UIImage? {
        guard let cg = img.cgImage, cg.width > 0, cg.height > 0 else { return nil }
        let w = max(2, cols), h = max(2, Int((Double(cols) * Double(cg.height) / Double(cg.width)).rounded()))
        var px = [UInt8](repeating: 0, count: w * h * 4)
        let ok = px.withUnsafeMutableBytes { buf -> Bool in
            guard let ctx = CGContext(data: buf.baseAddress, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
                                      space: CGColorSpaceCreateDeviceRGB(),
                                      bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { return false }
            ctx.interpolationQuality = .medium
            ctx.draw(cg, in: CGRect(x: 0, y: 0, width: w, height: h))
            return true
        }
        guard ok else { return nil }
        let step = 255.0 / Double(max(1, levels - 1))
        for i in stride(from: 0, to: px.count, by: 4) {
            for c in 0..<3 { px[i + c] = UInt8(min(255, (Double(px[i + c]) / step).rounded() * step)) }
        }
        guard let prov = CGDataProvider(data: Data(px) as CFData),
              let out = CGImage(width: w, height: h, bitsPerComponent: 8, bitsPerPixel: 32, bytesPerRow: w * 4,
                                space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue),
                                provider: prov, decode: nil, shouldInterpolate: false, intent: .defaultIntent) else { return nil }
        return UIImage(cgImage: out)
    }

    /// Order in which block (x, y) of a `cols` x `rows` grid sharpens: a fixed hash in 0..<1.
    static func order(_ x: Int, _ y: Int) -> Double {
        var h = UInt32(truncatingIfNeeded: x &* 73856093 ^ y &* 19349663) &+ 0x9e3779b9
        h ^= h >> 16; h &*= 0x7feb352d; h ^= h >> 15
        return Double(h % 10000) / 10000
    }

    /// Full-image reveal on a CALayer that currently shows a coarse image: the full image sharpens in
    /// block by block over `duration` (a mask of revealed blocks), then becomes the layer contents.
    @MainActor static func reveal(_ full: CGImage, on layer: CALayer, cols: Int = 18, duration: Double = 0.45) {
        layer.sublayers?.filter { $0.name == "mbReveal" }.forEach { $0.removeFromSuperlayer() }
        if UIAccessibility.isReduceMotionEnabled {
            let t = CATransition(); t.type = .fade; t.duration = 0.25
            layer.add(t, forKey: "fade")
            layer.contents = full
            layer.magnificationFilter = .linear
            return
        }
        let top = CALayer()
        top.name = "mbReveal"
        top.frame = layer.bounds
        top.contents = full
        top.contentsGravity = layer.contentsGravity
        top.masksToBounds = true
        let mask = CAShapeLayer()
        mask.frame = top.bounds
        top.mask = mask
        CATransaction.begin(); CATransaction.setDisableActions(true)
        layer.addSublayer(top)
        CATransaction.commit()
        let size = layer.bounds.size
        let rows = max(1, Int((Double(cols) * Double(size.height) / Double(max(1, size.width))).rounded()))
        let bw = size.width / CGFloat(cols), bh = size.height / CGFloat(rows)
        let start = CACurrentMediaTime()
        let link = CADisplayLink(target: LinkTarget { [weak layer, weak top] l in
            guard let layer, let top else { l.invalidate(); return }
            let k = min(1, (CACurrentMediaTime() - start) / duration)
            let path = CGMutablePath()
            for y in 0..<rows { for x in 0..<cols where order(x, y) < k {
                path.addRect(CGRect(x: CGFloat(x) * bw, y: CGFloat(y) * bh, width: bw + 0.5, height: bh + 0.5))
            } }
            CATransaction.begin(); CATransaction.setDisableActions(true)
            mask.path = path
            if k >= 1 {
                layer.contents = full
                layer.magnificationFilter = .linear
                top.removeFromSuperlayer()
                l.invalidate()
            }
            CATransaction.commit()
        }, selector: #selector(LinkTarget.tick(_:)))
        link.add(to: .main, forMode: .common)
    }
}

final class LinkTarget: NSObject {
    let fn: (CADisplayLink) -> Void
    init(_ fn: @escaping (CADisplayLink) -> Void) { self.fn = fn }
    @objc func tick(_ l: CADisplayLink) { fn(l) }
}
