import AVFoundation

/// Transition sounds. Generated procedurally by make_sfx.py (no third-party audio).
/// Ambient session: follows the silent switch and mixes with other audio, so music keeps playing.
///
/// Session setup and player loading run on a private serial queue, never on the main thread
/// (AVAudioSession warns that setActive can block the UI). play() is cheap, safe from the main
/// actor, and does nothing until the players are ready.
final class SFX: @unchecked Sendable {
    static let shared = SFX()

    private let queue = DispatchQueue(label: "org.slopgang.sfx", qos: .userInitiated)
    private var players: [String: AVAudioPlayer] = [:]   // only touched on `queue`
    private var ready = false                            // only touched on `queue`

    private init() {}

    /// Call once at launch. Returns at once; the work happens on the audio queue.
    func prepare() {
        queue.async { [self] in
            guard !ready else { return }
            let session = AVAudioSession.sharedInstance()
            do {
                try session.setCategory(.ambient, mode: .default, options: [.mixWithOthers])
                try session.setActive(true, options: [])
            } catch {
                // Sound is decoration: if the session fails, the transition still runs, silently.
                #if DEBUG
                print("SFX audio session:", error)
                #endif
            }
            for name in ["glitch-in", "glitch-out"] {
                guard let url = Bundle.main.url(forResource: name, withExtension: "wav"),
                      let p = try? AVAudioPlayer(contentsOf: url) else { continue }
                p.volume = 0.7
                _ = p.prepareToPlay()
                players[name] = p
            }
            ready = true
        }
    }

    /// Plays a sound from the start. No-op until prepare() has finished.
    func play(_ name: String) {
        queue.async { [self] in
            guard ready, let p = players[name] else { return }
            p.currentTime = 0
            _ = p.play()
        }
    }
}
