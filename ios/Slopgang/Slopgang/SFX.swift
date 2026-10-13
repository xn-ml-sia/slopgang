import AVFoundation

/// Transition sounds. Generated procedurally by make_sfx.py (no third-party audio).
/// Ambient session: follows the silent switch and mixes with other audio, so music keeps playing.
@MainActor
final class SFX {
    static let shared = SFX()
    private var players: [String: AVAudioPlayer] = [:]

    private init() {
        let session = AVAudioSession.sharedInstance()
        try? session.setCategory(.ambient, mode: .default, options: [.mixWithOthers])
        try? session.setActive(true, options: [])
        for name in ["glitch-in", "glitch-out"] {
            guard let url = Bundle.main.url(forResource: name, withExtension: "wav"),
                  let p = try? AVAudioPlayer(contentsOf: url) else { continue }
            p.volume = 0.7
            p.prepareToPlay()
            players[name] = p
        }
    }

    func play(_ name: String) {
        guard let p = players[name] else { return }
        p.currentTime = 0
        p.play()
    }
}
