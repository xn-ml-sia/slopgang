import SwiftUI
import UIKit
import AVFoundation
import QuartzCore

/// SwiftUI wrapper for the native HSL point cloud.
struct CloudView: UIViewRepresentable {
    var plates: [Plate]
    var onOpen: (Plate, CGRect) -> Void

    func makeUIView(context: Context) -> CloudUIView {
        let v = CloudUIView()
        v.onOpen = onOpen
        return v
    }

    func updateUIView(_ v: CloudUIView, context: Context) {
        v.onOpen = onOpen
        v.setPlates(plates)
    }

    static func dismantleUIView(_ v: CloudUIView, coordinator: ()) { v.stop() }
}

/// Port of src/components/FeedWall.tsx to UIKit + Core Animation.
/// Each plate is a CALayer placed in an HSL bicone by its thumbnail's mean color:
/// hue = angle, chroma = radius, lightness = height. A CADisplayLink projects the
/// points through a perspective orbit camera every frame.
final class CloudUIView: UIView, UIGestureRecognizerDelegate {
    var onOpen: ((Plate, CGRect) -> Void)?

    // Same constants as the site.
    private let R: Double = 230
    private let LY: Double = 260
    private let FOV: Double = 42 * .pi / 180
    private let DIST: Double = 380

    private final class Block {
        let plate: Plate
        let rank: Int
        let layer = CALayer()
        var p = SIMD3<Double>(0, 0, 0)
        var size: Double = 10
        var placed = false
        // Entrance arc: the block swings in from an angular and radial offset.
        var arcAngle: Double = 0
        var arcLift: Double = 0
        var start: CFTimeInterval = 0
        init(plate: Plate, rank: Int) { self.plate = plate; self.rank = rank }
    }

    private var blocks: [Block] = []
    private var ids: [String] = []
    private var link: CADisplayLink?
    private var last: CFTimeInterval = 0
    private var yaw = Double.random(in: 0..<(2 * .pi))   // random each launch, as on the site
    private var pitch = 0.32
    private var dragStart: (yaw: Double, pitch: Double)?
    private var active: Block?
    private let launchSeed = UInt32.random(in: 1...UInt32.max)

    private let background = CALayer()
    private let bgPlayerLayer = AVPlayerLayer()
    private let world = CALayer()
    private let tip = TipView()
    private var player: AVQueuePlayer?
    private var looper: AVPlayerLooper?
    private let haptic = UISelectionFeedbackGenerator()
    private var reduceMotion: Bool { UIAccessibility.isReduceMotionEnabled }

    override init(frame: CGRect) {
        super.init(frame: frame)
        backgroundColor = .black
        background.contentsGravity = .resizeAspectFill
        background.masksToBounds = true
        bgPlayerLayer.videoGravity = .resizeAspectFill
        layer.addSublayer(background)
        layer.addSublayer(bgPlayerLayer)
        layer.addSublayer(world)
        tip.isHidden = true
        tip.isUserInteractionEnabled = false
        addSubview(tip)

        let pan = UIPanGestureRecognizer(target: self, action: #selector(onPan(_:)))
        let tap = UITapGestureRecognizer(target: self, action: #selector(onTap(_:)))
        let press = UILongPressGestureRecognizer(target: self, action: #selector(onPress(_:)))
        press.minimumPressDuration = 0.22
        press.allowableMovement = .greatestFiniteMagnitude
        pan.delegate = self
        press.delegate = self
        [pan, tap, press].forEach(addGestureRecognizer)
        isAccessibilityElement = false
    }

    required init?(coder: NSCoder) { fatalError() }

    #if DEBUG
    /// -autoTap: after the cloud settles, drive the real tap handler at the centre of the frontmost plate.
    override func didMoveToWindow() {
        super.didMoveToWindow()
        guard window != nil, ProcessInfo.processInfo.arguments.contains("-autoTap") else { return }
        DispatchQueue.main.asyncAfter(deadline: .now() + 4) { [weak self] in
            guard let self, self.window != nil else { return }
            let front = self.blocks.filter { $0.placed }.max { $0.layer.zPosition < $1.layer.zPosition }
            guard let b = front else { print("[sg] autoTap: no plate"); return }
            let f = (b.layer.presentation() ?? b.layer).frame
            SGTrace.mark("tap received (autoTap)", reset: true)
            self.handleTap(CGPoint(x: f.midX, y: f.midY))
        }
    }
    #endif

    func gestureRecognizer(_ g: UIGestureRecognizer, shouldRecognizeSimultaneouslyWith o: UIGestureRecognizer) -> Bool { true }

    override func layoutSubviews() {
        super.layoutSubviews()
        CATransaction.begin(); CATransaction.setDisableActions(true)
        background.frame = bounds
        bgPlayerLayer.frame = bounds
        world.frame = bounds
        CATransaction.commit()
    }

    override func didMoveToWindow() {
        super.didMoveToWindow()
        if window != nil { startLink() } else { stop() }
    }

    func stop() {
        link?.invalidate(); link = nil
        clearActive()
    }

    private func startLink() {
        guard link == nil else { return }
        let l = CADisplayLink(target: self, selector: #selector(frameTick(_:)))
        l.preferredFrameRateRange = CAFrameRateRange(minimum: 30, maximum: 120, preferred: 60)
        l.add(to: .main, forMode: .common)
        link = l
        last = CACurrentMediaTime()
    }

    // MARK: Data

    func setPlates(_ plates: [Plate]) {
        let newIds = plates.map(\.id)
        guard newIds != ids else { return }
        ids = newIds
        blocks.forEach { $0.layer.removeFromSuperlayer() }
        blocks = plates.enumerated().map { Block(plate: $0.element, rank: $0.offset) }
        let launch = SeededRandom(seed: launchSeed)
        let now = CACurrentMediaTime()
        for b in blocks {
            b.layer.contentsGravity = .resizeAspectFill
            b.layer.masksToBounds = true
            b.layer.opacity = 0
            b.layer.backgroundColor = UIColor(white: 0.15, alpha: 1).cgColor
            world.addSublayer(b.layer)
            // A new random arc on every launch: direction, sweep and lift differ each time.
            b.arcAngle = (launch.next() < 0.5 ? -1 : 1) * (0.5 + launch.next() * 1.1)
            b.arcLift = (launch.next() - 0.5) * 140
            b.start = now + min(0.9, Double(b.rank) * 0.008)
            Task { await self.prepare(b) }
        }
    }

    private func prepare(_ b: Block) async {
        let px = await ImageLoader.shared.image(ArchiveStore.resolve(b.plate.thumbs?.px))
        let still = px == nil ? await ImageLoader.shared.image(ArchiveStore.resolve(b.plate.stillPath)) : nil
        var hsl = ImageLoader.fallbackHSL(b.plate.id)
        if let img = px ?? still, let m = await ImageLoader.shared.meanHSL(img) { hsl = m }
        place(b, hsl: hsl)
        let tex = b.size > 12 ? await ImageLoader.shared.image(ArchiveStore.resolve(b.plate.thumbs?.md)) : nil
        CATransaction.begin(); CATransaction.setDisableActions(true)
        b.layer.contents = (tex ?? px ?? still)?.cgImage
        CATransaction.commit()
        enter(b)
    }

    /// Same placement math as FeedWall.tsx `points`.
    private func place(_ b: Block, hsl: (Double, Double, Double)) {
        let (h, s, l) = hsl
        let j = SeededRandom(seed: fnv1a(b.plate.id))
        let chroma = s * (l < 0.5 ? l : 1 - l) * 2
        let rad = (chroma.squareRoot() * 0.9 + 0.08) * R + (j.next() - 0.5) * 34
        let a = h * .pi / 180 + (j.next() - 0.5) * 0.3
        b.p = SIMD3(rad * cos(a), (l - 0.5) * LY + (j.next() - 0.5) * 8, -rad * sin(a))
        let u = j.next()
        b.size = 6 + pow(u, 1.8) * 24 + (b.rank < 6 ? 8 : b.rank < 18 ? 3 : 0)
        b.placed = true
    }

    /// Scale-in with a spring (site: block-in 0.6s, rank x 8ms stagger, capped at 900ms).
    private func enter(_ b: Block) {
        b.layer.opacity = 1
        guard !reduceMotion else { return }
        let spring = CASpringAnimation(keyPath: "transform.scale")
        spring.fromValue = 0
        spring.toValue = 1
        spring.mass = 1
        spring.stiffness = 170
        spring.damping = 14
        spring.initialVelocity = 2
        spring.duration = spring.settlingDuration
        spring.beginTime = max(b.start, CACurrentMediaTime())
        spring.fillMode = .backwards
        b.layer.add(spring, forKey: "enter")
    }

    // MARK: Frame

    /// Damped spring 0 -> 1, used for the entrance arc that rides on top of the projection.
    private func springProgress(_ t: Double) -> Double {
        guard t > 0 else { return 0 }
        let w = 2 * Double.pi / 0.9, z = 0.62
        let wd = w * (1 - z * z).squareRoot()
        return 1 - exp(-z * w * t) * (cos(wd * t) + (z * w / wd) * sin(wd * t))
    }

    @objc private func frameTick(_ l: CADisplayLink) {
        let now = l.timestamp
        let dt = min(0.05, now - last)
        last = now
        if !reduceMotion && dragStart == nil && active == nil { yaw += dt * 0.08 }

        let w = Double(bounds.width), h = Double(bounds.height)
        guard w > 0, h > 0 else { return }
        let fpx = h / 2 / tan(FOV / 2)
        let fit = min(1, w / h / 1.2) * 1.15   // horizontal fit, same rule as the site
        // Vertical: stretch so the cloud spans the safe-area height on tall phones, not only the width.
        let safeTop = Double(safeAreaInsets.top) + 44, safeBottom = Double(safeAreaInsets.bottom) + 12
        let safeH = max(100, h - safeTop - safeBottom)
        let cyScreen = safeTop + safeH / 2
        // Half-height that real plates reach: the lightness axis (LY / 2 = 130). The bicone narrows at
        // its tips, so plates rarely go past that. Map it to 0.56 x safe height from centre
        // (112% of the half height), so the lightest and darkest plates reach the top bar and the bottom
        // edge, and some run a bit past.
        let extent = LY / 2
        let yFit = (safeH * 0.56) / (extent * fpx / DIST)
        let cyw = cos(yaw), syw = sin(yaw), cp = cos(pitch), sp = sin(pitch)

        CATransaction.begin(); CATransaction.setDisableActions(true)
        for b in blocks where b.placed {
            var (x, y, z) = (b.p.x, b.p.y, b.p.z)
            if !reduceMotion {
                // Entrance arc: rotate the point about the lightness axis and lift it, then let a spring settle it home.
                let k = springProgress(now - b.start)
                if k < 0.999 {
                    let ang = b.arcAngle * (1 - k)
                    let ca = cos(ang), sa = sin(ang)
                    let rx = x * ca - z * sa, rz = x * sa + z * ca
                    x = rx * (0.35 + 0.65 * k); z = rz * (0.35 + 0.65 * k)
                    y += b.arcLift * (1 - k)
                }
            }
            let x1 = x * cyw - z * syw
            let z1 = x * syw + z * cyw
            let y2 = y * cp - z1 * sp
            let z2 = y * sp + z1 * cp
            let depth = DIST - z2
            let k = (fpx / depth) * fit
            let sx = w / 2 + x1 * k
            let sy = cyScreen - y2 * (fpx / depth) * max(fit, yFit)
            let sz = max(1, b.size * k)
            let fog = min(1, max(0.25, 1 - (depth - DIST + 60) / 260))
            b.layer.bounds = CGRect(x: 0, y: 0, width: sz, height: sz)
            b.layer.position = CGPoint(x: sx, y: sy)
            let isActive = b === active
            b.layer.zPosition = isActive ? 20000 : CGFloat(10000 - depth * 10)
            b.layer.opacity = isActive ? 1 : Float(fog)
        }
        CATransaction.commit()
        if let a = active { positionTip(over: a) }
    }

    // MARK: Gestures

    /// The block's frame in window points, the focus point of the datamosh smear.
    private func screenRect(_ b: Block) -> CGRect {
        convert((b.layer.presentation() ?? b.layer).frame, to: nil)
    }

    private func hit(_ pt: CGPoint) -> Block? {
        let pad: CGFloat = 6   // small blocks are hard to hit with a finger
        return blocks
            .filter { $0.placed }
            .sorted { $0.layer.zPosition > $1.layer.zPosition }
            .first { ($0.layer.presentation() ?? $0.layer).frame.insetBy(dx: -pad, dy: -pad).contains(pt) }
    }

    @objc private func onTap(_ g: UITapGestureRecognizer) {
        SGTrace.mark("tap received", reset: true)
        handleTap(g.location(in: self))
    }

    private func handleTap(_ pt: CGPoint) {
        guard let b = hit(pt) else { return }
        onOpen?(b.plate, screenRect(b))
    }

    @objc private func onPan(_ g: UIPanGestureRecognizer) {
        guard active == nil else { return }
        switch g.state {
        case .began: dragStart = (yaw, pitch)
        case .changed:
            guard let s = dragStart else { return }
            let t = g.translation(in: self)
            yaw = s.yaw - Double(t.x) * 0.006
            pitch = max(-1.4, min(1.4, s.pitch + Double(t.y) * 0.006))
        default:
            // Keep a little of the fling so the orbit coasts, then settles.
            let v = g.velocity(in: self)
            coast(vx: Double(v.x))
            dragStart = nil
        }
    }

    private func coast(vx: Double) {
        guard !reduceMotion else { return }
        var vel = -vx * 0.006
        let start = CACurrentMediaTime()
        var prev = start
        let link = CADisplayLink(target: BlockTarget { [weak self] l in
            guard let self, self.dragStart == nil else { l.invalidate(); return }
            let dt = l.timestamp - prev; prev = l.timestamp
            self.yaw += vel * dt
            vel *= pow(0.04, dt)    // friction
            if abs(vel) < 0.02 || l.timestamp - start > 2 { l.invalidate() }
        }, selector: #selector(BlockTarget.tick(_:)))
        link.add(to: .main, forMode: .common)
    }

    /// Press and hold = the site's hover. Slide the finger to scrub between plates.
    @objc private func onPress(_ g: UILongPressGestureRecognizer) {
        switch g.state {
        case .began, .changed:
            let b = hit(g.location(in: self))
            if b !== active { setActive(b) }
        case .ended:
            SGTrace.mark("long-press release", reset: true)
            // Release over a plate opens it; release over empty space just closes the preview.
            let target = hit(g.location(in: self))
            clearActive()
            if let t = target { onOpen?(t.plate, screenRect(t)) }
        default:
            clearActive()
        }
    }

    // MARK: Preview (hover equivalent)

    private func setActive(_ b: Block?) {
        guard let b else { clearActive(); return }
        active = b
        haptic.selectionChanged()
        // Background switches at once, with no fade: thumbnail now, full media when it lands.
        CATransaction.begin(); CATransaction.setDisableActions(true)
        background.contents = b.layer.contents
        background.isHidden = false
        CATransaction.commit()
        stopVideo()
        let plate = b.plate
        if plate.isVideo, !reduceMotion, let url = ArchiveStore.resolve(plate.media?.url) {
            let item = AVPlayerItem(url: url)
            let q = AVQueuePlayer()
            q.isMuted = true
            looper = AVPlayerLooper(player: q, templateItem: item)
            player = q
            bgPlayerLayer.player = q
            bgPlayerLayer.isHidden = false
            tip.setPlayer(q)
            q.play()
        }
        Task {
            if let full = await ImageLoader.shared.image(ArchiveStore.resolve(plate.stillPath)), self.active === b {
                CATransaction.begin(); CATransaction.setDisableActions(true)
                self.background.contents = full.cgImage
                CATransaction.commit()
                self.tip.setImage(full)
            }
        }
        tip.configure(title: plate.shortTitle, caption: plate.caption ?? String((plate.timestamp ?? "").prefix(10)),
                      image: b.layer.contents.map { UIImage(cgImage: $0 as! CGImage) })
        tip.isHidden = false
        positionTip(over: b)
        if !reduceMotion {
            let s = CASpringAnimation(keyPath: "transform.scale")
            s.fromValue = 0.86; s.toValue = 1
            s.stiffness = 260; s.damping = 16
            s.duration = s.settlingDuration
            tip.layer.add(s, forKey: "pop")
        }
    }

    private func clearActive() {
        active = nil
        stopVideo()
        CATransaction.begin(); CATransaction.setDisableActions(true)
        background.contents = nil
        CATransaction.commit()
        tip.isHidden = true
    }

    private func stopVideo() {
        player?.pause()
        looper = nil
        player = nil
        bgPlayerLayer.player = nil
        bgPlayerLayer.isHidden = true
        tip.setPlayer(nil)
    }

    private func positionTip(over b: Block) {
        let f = (b.layer.presentation() ?? b.layer).frame
        let size = tip.sizeThatFits(.zero)
        var c = CGPoint(x: f.midX, y: f.minY - size.height / 2 - 18)  // above the finger
        c.x = min(max(size.width / 2 + 8, c.x), bounds.width - size.width / 2 - 8)
        c.y = max(size.height / 2 + safeAreaInsets.top + 8, c.y)
        tip.bounds = CGRect(origin: .zero, size: size)
        tip.center = c
    }
}

/// Lets a closure drive a CADisplayLink without a retain cycle on the view.
private final class BlockTarget: NSObject {
    let fn: (CADisplayLink) -> Void
    init(_ fn: @escaping (CADisplayLink) -> Void) { self.fn = fn }
    @objc func tick(_ l: CADisplayLink) { fn(l) }
}

/// The white preview card (site: .cloud-tip, 220px wide, title + two-line caption).
final class TipView: UIView {
    private let imageView = UIImageView()
    private let playerLayer = AVPlayerLayer()
    private let title = UILabel()
    private let caption = UILabel()
    private let width: CGFloat = 220   // .cloud-tip width 220px

    override init(frame: CGRect) {
        super.init(frame: frame)
        backgroundColor = .white
        imageView.contentMode = .scaleAspectFill
        imageView.clipsToBounds = true
        playerLayer.videoGravity = .resizeAspectFill
        imageView.layer.addSublayer(playerLayer)
        title.font = UIFont(name: "Inter-SemiBold", size: Theme.tMinus1) ?? .systemFont(ofSize: Theme.tMinus1, weight: .semibold)
        title.textColor = .black
        caption.font = UIFont(name: "Inter-Regular", size: Theme.tMinus1) ?? .systemFont(ofSize: Theme.tMinus1)
        caption.textColor = .black
        caption.numberOfLines = 2
        [imageView, title, caption].forEach(addSubview)
    }
    required init?(coder: NSCoder) { fatalError() }

    func configure(title t: String, caption c: String, image: UIImage?) {
        title.text = t; caption.text = c; imageView.image = image
        setNeedsLayout()
    }
    func setImage(_ i: UIImage) { imageView.image = i }
    func setPlayer(_ p: AVPlayer?) { playerLayer.player = p; playerLayer.isHidden = p == nil }

    override func sizeThatFits(_ size: CGSize) -> CGSize {
        let ch = caption.sizeThatFits(CGSize(width: width - 19.2, height: 100)).height
        let th = ceil(Theme.tMinus1 * Theme.tipLineHeight)
        return CGSize(width: width, height: width + 6.4 + th + 1.6 + ch + 8)   // label padding 0.4rem 0.6rem 0.5rem, gap 0.1rem
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        imageView.frame = CGRect(x: 0, y: 0, width: width, height: width)
        CATransaction.begin(); CATransaction.setDisableActions(true)
        playerLayer.frame = imageView.bounds
        CATransaction.commit()
        let th = ceil(Theme.tMinus1 * Theme.tipLineHeight)
        title.frame = CGRect(x: 9.6, y: width + 6.4, width: width - 19.2, height: th)
        let ch = caption.sizeThatFits(CGSize(width: width - 19.2, height: 100)).height
        caption.frame = CGRect(x: 9.6, y: width + 6.4 + th + 1.6, width: width - 19.2, height: ch)
    }
}
