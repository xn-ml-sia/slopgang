import SwiftUI
import UIKit

/// Runs the datamosh transition between two screens.
/// 1. Snapshot the current screen and cover it with an overlay window.
/// 2. Change the route with no system animation, then snapshot the new screen.
/// 3. MoshView runs the decoder simulation: the new screen moves into the input frame
///    (growing from the tapped plate, or settling from a zoom), its block motion drags the
///    old screen's pixels, blocks heal, and a clean keyframe lands at the end.
/// Reduce Motion, or no Metal, gets a plain 250 ms crossfade. The sound starts with the change.
@MainActor
final class GlitchDirector: ObservableObject {
    static let pushDuration = 0.52   // matches glitch-in.wav
    static let popDuration = 0.30    // matches glitch-out.wav

    private var overlay: UIWindow?
    private var hold: UIImageView?
    private var mosh: MoshView?
    private var busy = false

    /// Forward: home -> detail. `rect` is the tapped plate in window points, if known.
    func push(from rect: CGRect?, _ change: @escaping () -> Void) {
        var p = MoshParams()
        p.duration = Self.pushDuration
        run(params: p, sound: "glitch-in", motion: { bounds in
            .grow(from: rect ?? CGRect(x: bounds.midX - 40, y: bounds.midY - 40, width: 80, height: 80))
        }, change)
    }

    /// Back: shorter, gentler, with motion that keeps flowing (melt).
    func pop(_ change: @escaping () -> Void) {
        var p = MoshParams()
        p.duration = Self.popDuration
        p.smear = 1.2
        p.melt = 0.5
        p.healStart = 0.03
        p.healEnd = 0.45
        run(params: p, sound: "glitch-out", motion: { _ in .settle(scale: 1.18) }, change)
    }

    private func keyWindow() -> UIWindow? {
        UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows).first { $0.isKeyWindow && $0 !== overlay }
    }

    private func snapshot(_ w: UIWindow, after: Bool) -> UIImage {
        let fmt = UIGraphicsImageRendererFormat(for: w.traitCollection)
        fmt.opaque = true
        fmt.preferredRange = .standard   // plain 8-bit sRGB, not extended range
        fmt.scale = w.screen.scale
        return UIGraphicsImageRenderer(bounds: w.bounds, format: fmt).image { _ in
            _ = w.drawHierarchy(in: w.bounds, afterScreenUpdates: after)
        }
    }

    private var token = 0

    private func run(params: MoshParams, sound: String, motion: @escaping (CGRect) -> MoshMotion, _ change: @escaping () -> Void) {
        guard !busy, let w = keyWindow(), let scene = w.windowScene, w.bounds.width > 0, w.bounds.height > 0 else {
            noAnimation(change); return
        }
        busy = true
        token += 1
        let my = token
        let from = snapshot(w, after: false)
        let (o, hold, mosh) = overlayViews(scene: scene, frame: w.bounds)
        hold.image = from
        hold.alpha = 1
        hold.isHidden = false
        mosh.isHidden = true
        o.isHidden = false              // swallows taps while the transition runs (at most ~1 s)
        noAnimation(change)
        SFX.shared.play(sound)
        // Hard safety: whatever happens, the overlay is gone shortly after the transition should end.
        DispatchQueue.main.asyncAfter(deadline: .now() + params.duration + 0.5) { [weak self] in
            guard let self, self.token == my, self.busy else { return }
            #if DEBUG
            print("[sg] transition watchdog fired")
            #endif
            self.finish()
        }
        let reduce = UIAccessibility.isReduceMotionEnabled
        // Give the new screen two frames to lay out, then capture it.
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) { [weak self] in
            guard let self, self.token == my, self.busy else { return }
            let crossfade = {
                UIView.animate(withDuration: 0.25, delay: 0, options: [.curveEaseOut, .allowUserInteraction]) { hold.alpha = 0 }
                    completion: { _ in if self.token == my { self.finish() } }
            }
            if reduce { crossfade(); return }
            let to = self.snapshot(w, after: true)
            mosh.frame = o.bounds
            mosh.drawableSize = CGSize(width: o.bounds.width * w.screen.scale, height: o.bounds.height * w.screen.scale)
            mosh.onFirstFrame = { if self.token == my { hold.isHidden = true } }
            let started = mosh.run(old: from, new: to, motion: motion(o.bounds), params: params) {
                if self.token == my { self.finish() }
            }
            #if DEBUG
            print("[sg] mosh started:", started)
            #endif
            if started { mosh.isHidden = false } else { crossfade() }
        }
    }

    private func noAnimation(_ change: () -> Void) {
        var t = Transaction()
        t.disablesAnimations = true
        withTransaction(t) { change() }
    }

    private func overlayViews(scene: UIWindowScene, frame: CGRect) -> (UIWindow, UIImageView, MoshView) {
        if let o = overlay, let h = hold, let m = mosh { o.frame = frame; return (o, h, m) }
        let o = UIWindow(windowScene: scene)
        o.windowLevel = .alert + 1
        o.frame = frame
        let vc = UIViewController()
        vc.view.backgroundColor = .clear
        let m = MoshView()
        m.frame = vc.view.bounds
        m.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        let h = UIImageView(frame: vc.view.bounds)
        h.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        h.contentMode = .scaleToFill
        vc.view.addSubview(m)
        vc.view.addSubview(h)          // the still sits above until the first moshed frame
        o.rootViewController = vc
        overlay = o; hold = h; mosh = m
        return (o, h, m)
    }

    private func finish() {
        mosh?.cancel()
        mosh?.isHidden = true
        overlay?.isHidden = true
        hold?.layer.removeAllAnimations()
        hold?.image = nil
        busy = false
        #if DEBUG
        print("[sg] transition finished")
        #endif
    }
}
