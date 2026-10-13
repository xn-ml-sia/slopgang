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
/// DEBUG timeline for the tap -> detail transition. Prints ms since the last "tap".
enum SGTrace {
    nonisolated(unsafe) static var t0 = CACurrentMediaTime()
    nonisolated static func mark(_ s: String, reset: Bool = false) {
        #if DEBUG
        let now = CACurrentMediaTime()
        if reset { t0 = now }
        print(String(format: "[sg][t] %7.1f ms  %@", (now - t0) * 1000, s))
        #endif
    }
}

final class GlitchDirector: ObservableObject {
    static let pushDuration = 1.4    // tap -> clean detail; matches glitch-in.wav
    static let popDuration = 0.20    // matches glitch-out.wav

    private var overlay: UIWindow?
    private var hold: UIImageView?
    private var mosh: MoshView?
    private var busy = false

    /// Forward: home -> detail. `rect` is the tapped plate in window points, if known.
    /// `mediaAspect` is the plate's height / width, used to aim the motion at the detail media rect.
    func push(from rect: CGRect?, mediaAspect: CGFloat = 0.75, _ change: @escaping () -> Void) {
        // Fresh P-frame duplication effect (no stacked smear/drift/heal tuning).
        var p = MoshParams()
        p.duration = Self.pushDuration
        p.pdupGain = 1.0
        p.pdupGainFrom = 0.25
        p.rampPower = 1.4
        p.pdupReach = 7
        p.pdupPull = 0.14          // whole screen fills with the thumbnail's pixels by the late phase
        p.diffusion = 0.12
        p.blockSchedule = [(1, 1)]
        let top = keyWindow()?.safeAreaInsets.top ?? 59
        run(params: p, sound: "glitch-in", motion: { bounds in
            // Detail hero: full width under the nav bar, at the plate's aspect (capped like the site).
            let mh = min(bounds.height * 0.6, bounds.width * max(0.3, mediaAspect))
            let hero = CGRect(x: 0, y: top + 44, width: bounds.width, height: mh)
            guard let from = rect, from.width > 1, from.height > 1 else {
                return .grow(from: CGRect(x: bounds.midX - 40, y: bounds.midY - 40, width: 80, height: 80), via: hero)
            }
            // The thumbnail is drawn aspect-fill on Home; crop its centre to the hero's aspect so it
            // flies without stretching.
            let ha = hero.height / hero.width
            var crop = from
            if from.height / from.width > ha { crop.size.height = from.width * ha; crop.origin.y = from.midY - crop.height / 2 }
            else { crop.size.width = from.height / ha; crop.origin.x = from.midX - crop.width / 2 }
            return .pdup(from: from, to: hero, crop: crop)
        }, change)
    }

    /// Back: shorter, gentler, with motion that keeps flowing (melt).
    func pop(_ change: @escaping () -> Void) {
        var p = MoshParams()
        p.duration = Self.popDuration
        p.smear = 1.35
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
        var params = params
        #if DEBUG
        // -moshSlow 8 stretches the transition 8x so simulator screenshots can catch mid frames.
        let args = ProcessInfo.processInfo.arguments
        if let i = args.firstIndex(of: "-moshSlow"), i + 1 < args.count, let k = Double(args[i + 1]), k > 0 { params.duration *= k }
        #endif
        guard !busy, let w = keyWindow(), let scene = w.windowScene, w.bounds.width > 0, w.bounds.height > 0 else {
            noAnimation(change); return
        }
        busy = true
        token += 1
        let my = token
        SGTrace.mark("push begin")
        let began = CACurrentMediaTime()
        let from = snapshot(w, after: false)
        SGTrace.mark("snapshot 1 (old screen)")
        let (o, hold, mosh) = overlayViews(scene: scene, frame: w.bounds)
        hold.image = from
        hold.alpha = 1
        hold.isHidden = false
        mosh.isHidden = true
        o.isHidden = false              // swallows taps while the transition runs (at most ~1 s)
        noAnimation(change)
        SGTrace.mark("nav change applied")
        SFX.shared.play(sound)
        SGTrace.mark("sfx play called")
        // Hard safety: whatever happens, the overlay is gone shortly after the transition should end.
        DispatchQueue.main.asyncAfter(deadline: .now() + params.duration + 0.5) { [weak self] in
            guard let self, self.token == my, self.busy else { return }
            #if DEBUG
            SGTrace.mark("WATCHDOG finish")
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
            SGTrace.mark("snapshot 2 begin")
            let to = self.snapshot(w, after: true)
            SGTrace.mark("snapshot 2 (new screen)")
            mosh.frame = o.bounds
            mosh.drawableSize = CGSize(width: o.bounds.width * w.screen.scale, height: o.bounds.height * w.screen.scale)
            mosh.onFirstFrame = { SGTrace.mark("mosh first frame on screen"); if self.token == my { hold.isHidden = true } }
            // Count the snapshot/setup time against the budget so tap -> clean detail stays ~duration.
            var timed = params
            timed.duration = max(params.duration * 0.6, params.duration - (CACurrentMediaTime() - began))
            let started = mosh.run(old: from, new: to, motion: motion(o.bounds), params: timed) {
                SGTrace.mark("mosh normal finish")
                if self.token == my { self.finish() }
            }
            #if DEBUG
            print("[sg] mosh started:", started); SGTrace.mark("mosh run returned")
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
