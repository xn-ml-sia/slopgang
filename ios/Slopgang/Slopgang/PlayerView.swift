import SwiftUI
import AVFoundation
import UIKit

/// AVPlayerLayer-backed view with native play/pause on tap (site: <video controls>).
struct PlayerView: UIViewRepresentable {
    var url: URL
    var poster: URL?

    func makeUIView(context: Context) -> PlayerUIView { PlayerUIView(url: url, poster: poster) }
    func updateUIView(_ v: PlayerUIView, context: Context) {}
    static func dismantleUIView(_ v: PlayerUIView, coordinator: ()) { v.player.pause() }
}

final class PlayerUIView: UIView {
    let player: AVQueuePlayer
    private var looper: AVPlayerLooper?
    private let posterLayer = CALayer()
    private let icon = UIImageView(image: UIImage(systemName: "play.fill"))
    override class var layerClass: AnyClass { AVPlayerLayer.self }
    private var playerLayer: AVPlayerLayer { layer as! AVPlayerLayer }
    private var readyObs: NSKeyValueObservation?

    init(url: URL, poster: URL?) {
        player = AVQueuePlayer()
        super.init(frame: .zero)
        looper = AVPlayerLooper(player: player, templateItem: AVPlayerItem(url: url))
        player.isMuted = true
        playerLayer.player = player
        playerLayer.videoGravity = .resizeAspect
        backgroundColor = .black
        posterLayer.contentsGravity = .resizeAspect
        layer.addSublayer(posterLayer)
        icon.tintColor = .white
        addSubview(icon)
        readyObs = playerLayer.observe(\.isReadyForDisplay) { [weak self] l, _ in
            DispatchQueue.main.async { if l.isReadyForDisplay { self?.posterLayer.isHidden = true } }
        }
        if let poster { Task { [weak self] in
            let img = await ImageLoader.shared.image(poster)
            self?.posterLayer.contents = img?.cgImage
        } }
        addGestureRecognizer(UITapGestureRecognizer(target: self, action: #selector(toggle)))
        isAccessibilityElement = true
        accessibilityTraits = .startsMediaSession
        accessibilityLabel = "Play video"
    }
    required init?(coder: NSCoder) { fatalError() }

    override func layoutSubviews() {
        super.layoutSubviews()
        posterLayer.frame = bounds
        icon.frame = CGRect(x: 12, y: bounds.height - 36, width: 24, height: 24)
    }

    @objc private func toggle() {
        if player.timeControlStatus == .playing { player.pause(); icon.isHidden = false; accessibilityLabel = "Play video" }
        else { player.isMuted = false; player.play(); icon.isHidden = true; accessibilityLabel = "Pause video" }
    }
}
