import Foundation
import SwiftUI

/// Loads live data from slopgang.org and keeps the last good copy on disk.
@MainActor
final class ArchiveStore: ObservableObject {
    nonisolated static let base = URL(string: "https://slopgang.org/")!

    @Published private(set) var plates: [Plate] = []
    @Published private(set) var about: AboutFile?
    @Published private(set) var status: String?

    private var byId: [String: Plate] = [:]

    nonisolated static let session: URLSession = {
        let cfg = URLSessionConfiguration.default
        cfg.urlCache = URLCache(memoryCapacity: 64 << 20, diskCapacity: 512 << 20)
        cfg.requestCachePolicy = .useProtocolCachePolicy
        return URLSession(configuration: cfg)
    }()

    nonisolated static func resolve(_ path: String?) -> URL? {
        guard let p = path, !p.isEmpty else { return nil }
        return URL(string: p, relativeTo: base)?.absoluteURL
    }

    private func cacheURL(_ name: String) -> URL {
        FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0].appendingPathComponent(name)
    }

    func load() async {
        if plates.isEmpty, let d = try? Data(contentsOf: cacheURL("archive.json")) { apply(archive: d) }
        if about == nil, let d = try? Data(contentsOf: cacheURL("about.json")) { apply(about: d) }
        async let a = fetch("archive.json")
        async let b = fetch("about.json")
        let (ad, bd) = await (a, b)
        if let ad, apply(archive: ad) { try? ad.write(to: cacheURL("archive.json"), options: .atomic); status = nil }
        else if plates.isEmpty { status = "Could not reach slopgang.org." }
        else { status = "Offline. Showing the saved archive." }
        if let bd, apply(about: bd) { try? bd.write(to: cacheURL("about.json"), options: .atomic) }
    }

    private func fetch(_ name: String) async -> Data? {
        var req = URLRequest(url: Self.base.appendingPathComponent(name))
        req.cachePolicy = .reloadIgnoringLocalCacheData
        req.timeoutInterval = 15
        guard let (d, r) = try? await Self.session.data(for: req), (r as? HTTPURLResponse)?.statusCode == 200 else { return nil }
        return d
    }

    @discardableResult private func apply(archive d: Data) -> Bool {
        guard let file = try? JSONDecoder().decode(ArchiveFile.self, from: d), !file.items.isEmpty else { return false }
        // Newest first, like the site cloud.
        plates = file.items.sorted { $0.number > $1.number }
        byId = Dictionary(plates.map { ($0.slugValue.lowercased(), $0) }, uniquingKeysWith: { a, _ in a })
        return true
    }

    @discardableResult private func apply(about d: Data) -> Bool {
        guard let f = try? JSONDecoder().decode(AboutFile.self, from: d) else { return false }
        about = f
        return true
    }

    func plate(_ slugOrId: String) -> Plate? {
        byId[slugOrId.replacingOccurrences(of: "archive:", with: "").lowercased()]
    }

    /// Glitch posts that link to this plate (reverse of relatedSlop).
    func glitchPairs(for p: Plate) -> [(Plate, String)] {
        let slug = p.slugValue.lowercased()
        return plates.flatMap { g in
            (g.relatedSlop ?? []).filter { $0.id.lowercased() == slug }.map { (g, $0.reason ?? "") }
        }
    }
}
