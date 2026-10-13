import SwiftUI
import UIKit

/// Runs the glitch / datamosh transition between two screens.
/// 1. Snapshot the current screen. 2. Cover it with an overlay window. 3. Change the route with no
/// system animation. 4. Snapshot the new screen. 5. Play the Metal shader from old to new with the
/// sound, then remove the overlay. Reduce Motion gets a plain 250 ms crossfade.
@MainActor
final class GlitchDirector: ObservableObject {
    final class Model: ObservableObject {
        @Published var from: UIImage?
        @Published var to: UIImage?
        @Published var start: Date?
        @Published var fadeOut = false
        var duration: Double = 0.52
        var tap: CGPoint = .zero
        var mosh: Float = 1
        var seed: Float = 0
    }

    private let model = Model()
    private var overlay: UIWindow?
    private var busy = false

    static let pushDuration = 0.52   // matches glitch-in.wav
    static let popDuration = 0.30    // matches glitch-out.wav

    /// Forward: home -> detail. `rect` is the tapped plate in screen points, if known.
    func push(from rect: CGRect?, _ change: @escaping () -> Void) {
        run(duration: Self.pushDuration, mosh: 1, sound: "glitch-in", focus: rect, change)
    }

    /// Back: a shorter version with a weaker smear.
    func pop(_ change: @escaping () -> Void) {
        run(duration: Self.popDuration, mosh: 0.45, sound: "glitch-out", focus: nil, change)
    }

    private func keyWindow() -> UIWindow? {
        UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows).first { $0.isKeyWindow && $0 !== overlay }
    }

    private func snapshot(_ w: UIWindow, after: Bool) -> UIImage {
        let fmt = UIGraphicsImageRendererFormat(for: w.traitCollection)
        fmt.opaque = true
        return UIGraphicsImageRenderer(bounds: w.bounds, format: fmt).image { _ in
            _ = w.drawHierarchy(in: w.bounds, afterScreenUpdates: after)
        }
    }

    private func run(duration: Double, mosh: Float, sound: String, focus: CGRect?, _ change: @escaping () -> Void) {
        guard !busy, let w = keyWindow(), let scene = w.windowScene else { noAnimation(change); return }
        busy = true
        let from = snapshot(w, after: false)
        model.from = from; model.to = nil; model.start = nil; model.fadeOut = false
        model.duration = duration
        model.mosh = mosh
        model.seed = Float.random(in: 0..<100)
        model.tap = focus.map { CGPoint(x: $0.midX, y: $0.midY) } ?? CGPoint(x: w.bounds.midX, y: w.bounds.midY * 0.6)
        showOverlay(scene: scene, frame: w.bounds)
        noAnimation(change)
        SFX.shared.play(sound)
        let reduce = UIAccessibility.isReduceMotionEnabled
        // Give the new screen two frames to lay out, then capture it.
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) { [weak self] in
            guard let self else { return }
            if reduce {
                withAnimation(.easeOut(duration: 0.25)) { self.model.fadeOut = true }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.27) { self.finish() }
                return
            }
            self.model.to = self.snapshot(w, after: true)
            self.model.start = Date()
            DispatchQueue.main.asyncAfter(deadline: .now() + duration) { self.finish() }
        }
    }

    private func noAnimation(_ change: () -> Void) {
        var t = Transaction()
        t.disablesAnimations = true
        withTransaction(t) { change() }
    }

    private func showOverlay(scene: UIWindowScene, frame: CGRect) {
        if overlay == nil {
            let o = UIWindow(windowScene: scene)
            o.windowLevel = .alert + 1
            o.backgroundColor = .clear
            let host = UIHostingController(rootView: GlitchOverlay(model: model))
            host.view.backgroundColor = .clear
            o.rootViewController = host
            overlay = o
        }
        overlay?.frame = frame
        overlay?.isHidden = false      // also swallows taps while the transition runs
    }

    private func finish() {
        overlay?.isHidden = true
        model.from = nil; model.to = nil; model.start = nil; model.fadeOut = false
        busy = false
    }
}

struct GlitchOverlay: View {
    @ObservedObject var model: GlitchDirector.Model

    var body: some View {
        GeometryReader { geo in
            let size = geo.size
            ZStack {
                if let to = model.to, let from = model.from, let start = model.start {
                    TimelineView(.animation) { ctx in
                        let p = Float(min(1, ctx.date.timeIntervalSince(start) / model.duration))
                        Image(uiImage: to)
                            .resizable()
                            .frame(width: size.width, height: size.height)
                            .layerEffect(
                                ShaderLibrary.glitchTransition(
                                    .image(Image(uiImage: from)),
                                    .float2(size),
                                    .float2(model.tap),
                                    .float(p),
                                    .float(model.mosh),
                                    .float(model.seed)
                                ),
                                maxSampleOffset: CGSize(width: 160, height: 0)
                            )
                    }
                } else if let from = model.from {
                    Image(uiImage: from)
                        .resizable()
                        .frame(width: size.width, height: size.height)
                        .opacity(model.fadeOut ? 0 : 1)
                }
            }
        }
        .ignoresSafeArea()
        .allowsHitTesting(true)
    }
}
