import SwiftUI
import UIKit
import QuartzCore

/// Native port of src/components/DotForgeCellular.tsx, the About hero artwork.
/// The site draws an 800px canvas of 8px cells (100 x 100), white on black, each cell
/// alive or dead from an integer hash of its position and a phase. With the site's
/// settings (intensity 50, threshold 128, spread 50) the Bayer dither always resolves to
/// the cell value, so the picture is exactly the 100 x 100 cell grid.
/// The phase is floor(t * 3) with t += 0.016 per frame, so it steps about every 21 frames
/// (about 0.35 s at 60 fps). Here a CADisplayLink steps the phase on the same schedule and
/// a CALayer shows the grid as a CGImage with nearest-neighbour scaling.
struct DotForgeView: UIViewRepresentable {
    func makeUIView(context: Context) -> DotForgeUIView { DotForgeUIView() }
    func updateUIView(_ v: DotForgeUIView, context: Context) {}
    static func dismantleUIView(_ v: DotForgeUIView, coordinator: ()) { v.stop() }
}

final class DotForgeUIView: UIView {
    private static let cells = 100          // 800 / cellSize 8
    private let grid = CALayer()
    private var link: CADisplayLink?
    private var frames = 0
    private var phase = -1

    override init(frame: CGRect) {
        super.init(frame: frame)
        backgroundColor = .black
        grid.magnificationFilter = .nearest
        grid.contentsGravity = .resizeAspect
        layer.addSublayer(grid)
        isAccessibilityElement = false
        render(phase: 0)
    }
    required init?(coder: NSCoder) { fatalError() }

    override func layoutSubviews() {
        super.layoutSubviews()
        CATransaction.begin(); CATransaction.setDisableActions(true)
        grid.frame = bounds
        CATransaction.commit()
    }

    override func didMoveToWindow() {
        super.didMoveToWindow()
        if window != nil, !UIAccessibility.isReduceMotionEnabled, link == nil {
            let l = CADisplayLink(target: self, selector: #selector(tick))
            l.preferredFrameRateRange = CAFrameRateRange(minimum: 60, maximum: 60, preferred: 60)
            l.add(to: .main, forMode: .common)
            link = l
        } else if window == nil { stop() }
    }

    func stop() { link?.invalidate(); link = nil }

    @objc private func tick() {
        frames += 1
        let t = Double(frames) * 0.016
        let p = Int(floor(t * 3))
        if p != phase { render(phase: p) }
    }

    /// JS: ((seed * 2654435761) >>> 0) / 2^32, where seed is an int32 and the product is a double.
    private static func h(_ cx: Int, _ cy: Int, _ phase: Int) -> Double {
        let seed = Int32(truncatingIfNeeded: cx * 48271 + cy * 16807 + phase * 65521)
        var m = fmod(Double(seed) * 2654435761.0, 4294967296.0)
        if m < 0 { m += 4294967296.0 }
        return m / 4294967296.0
    }

    static func alive(_ cx: Int, _ cy: Int, _ phase: Int) -> Bool {
        let self0 = h(cx, cy, phase)
        let n = (h(cx - 1, cy, phase) + h(cx + 1, cy, phase) + h(cx, cy - 1, phase) + h(cx, cy + 1, phase)) / 4
        return (self0 > 0.5) != (n > 0.55)
    }

    private func render(phase p: Int) {
        phase = p
        let n = Self.cells
        var px = [UInt8](repeating: 0, count: n * n)
        for y in 0..<n { for x in 0..<n where Self.alive(x, y, p) { px[y * n + x] = 255 } }
        guard let provider = CGDataProvider(data: Data(px) as CFData),
              let img = CGImage(width: n, height: n, bitsPerComponent: 8, bitsPerPixel: 8, bytesPerRow: n,
                                space: CGColorSpaceCreateDeviceGray(), bitmapInfo: CGBitmapInfo(rawValue: 0),
                                provider: provider, decode: nil, shouldInterpolate: false, intent: .defaultIntent)
        else { return }
        CATransaction.begin(); CATransaction.setDisableActions(true)
        grid.contents = img
        CATransaction.commit()
    }
}
