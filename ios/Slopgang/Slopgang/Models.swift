import Foundation

/// Mirrors https://slopgang.org/archive.json (built from src/data/archive.json).
/// Every field except id is optional so a new or missing field never breaks the app.
struct ArchiveFile: Decodable {
    var version: Int?
    var generatedAt: String?
    var items: [Plate]

    init(from decoder: Decoder) throws {
        // Accept either { items: [...] } or a bare array.
        if let c = try? decoder.container(keyedBy: CodingKeys.self) {
            version = try c.decodeIfPresent(Int.self, forKey: .version)
            generatedAt = try c.decodeIfPresent(String.self, forKey: .generatedAt)
            items = (try c.decodeIfPresent(Lossy<Plate>.self, forKey: .items))?.values ?? []
        } else {
            items = try Lossy<Plate>(from: decoder).values
        }
    }
    enum CodingKeys: String, CodingKey { case version, generatedAt, items }
}

/// Decodes an array and drops elements that fail, instead of failing the whole file.
struct Lossy<T: Decodable>: Decodable {
    var values: [T]
    init(from decoder: Decoder) throws {
        var c = try decoder.unkeyedContainer()
        var out: [T] = []
        while !c.isAtEnd {
            if let v = try? c.decode(T.self) { out.append(v) } else { _ = try? c.decode(Skip.self) }
        }
        values = out
    }
    private struct Skip: Decodable {}
}

enum PlateKind: String, Decodable { case slop, pair, glitch, unknown
    init(from decoder: Decoder) throws {
        self = PlateKind(rawValue: (try? decoder.singleValueContainer().decode(String.self)) ?? "") ?? .unknown
    }
}

struct Plate: Decodable, Identifiable, Hashable {
    static func == (a: Plate, b: Plate) -> Bool { a.id == b.id }
    func hash(into h: inout Hasher) { h.combine(id) }

    var id: String
    var slug: String?
    var kind: PlateKind?
    var pairLabel: String?
    var glitchType: String?
    var title: String?
    var caption: String?
    var body: String?
    var essay: String?
    var url: String?
    var timestamp: String?
    var tags: [String]?
    var author: String?
    var loggedBy: String?
    var media: Media?
    var thumbs: Thumbs?
    var researcher: PairSide?
    var artist: PairSide?
    var evidence: String?
    var sources: [String]?
    var image: ImageCredit?
    var relatedSlop: [RelatedLink]?

    struct Media: Decodable { var type: String?; var url: String?; var poster: String?; var alt: String?; var width: Double?; var height: Double? }
    struct Thumbs: Decodable { var px: String?; var md: String? }
    struct PairSide: Decodable { var name: String?; var work: String?; var year: String?; var url: String?; var handle: String?; var handleVerified: Bool? }
    struct ImageCredit: Decodable { var src: String?; var credit: String?; var license: String?; var link: String? }
    struct RelatedLink: Decodable, Hashable { var id: String; var reason: String? }

    // MARK: Derived values, same rules as the site.

    /// sg number, used for newest-first order like the site.
    var number: Int {
        guard let r = slugValue.range(of: #"\d+"#, options: .regularExpression) else { return -1 }
        return Int(slugValue[r]) ?? -1
    }

    var slugValue: String { slug ?? id.replacingOccurrences(of: "archive:", with: "") }

    var shortTitle: String {
        let t = title ?? slugValue
        if let r = t.range(of: #"^Specimen\s+\d+\s+[—–-]\s*"#, options: [.regularExpression, .caseInsensitive]) {
            return String(t[r.upperBound...]).trimmingCharacters(in: .whitespaces)
        }
        return t
    }

    var catalogue: String {
        let s = slugValue
        if let r = s.range(of: #"^sg-(\d+)$"#, options: [.regularExpression, .caseInsensitive]) {
            let n = s[r].dropFirst(3)
            return "SG-" + String(repeating: "0", count: max(0, 3 - n.count)) + n
        }
        return s.uppercased()
    }

    var date: Date? {
        guard let t = timestamp else { return nil }
        let f = ISO8601DateFormatter(); f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f.date(from: t) ?? ISO8601DateFormatter().date(from: t)
    }

    var loggedDate: String {
        guard let d = date else { return timestamp ?? "" }
        let f = DateFormatter(); f.locale = Locale(identifier: "en_GB"); f.timeZone = TimeZone(identifier: "UTC")
        f.dateFormat = "d MMM yyyy"
        return f.string(from: d)
    }

    var register: String {
        let map = ["visual-slop": "Visual", "textual-slop": "Textual", "counter-slop": "Counter"]
        return (tags ?? []).map { map[$0] ?? $0 }.joined(separator: ", ")
    }

    var glitchTypeLabel: String? {
        guard let g = glitchType else { return nil }
        let map = ["artifact": "Model artifact", "adversarial": "Adversarial", "collapse": "Model collapse",
                   "hallucination": "Hallucination", "artist": "Artist-made glitch"]
        return map[g] ?? g.capitalized
    }

    var isVideo: Bool { media?.type == "video" || (media?.url ?? "").lowercased().hasSuffix(".mp4") }
    var stillPath: String? { isVideo ? media?.poster : media?.url }
    var paragraphs: [String] {
        let text = (essay?.trimmingCharacters(in: .whitespacesAndNewlines)).flatMap { $0.isEmpty ? nil : $0 }
            ?? body?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return text.components(separatedBy: "\n\n").map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty }
    }
}

struct AboutFile: Decodable {
    var title: String?
    var lead: String?
    var sections: [Section]?
    var sources: [Source]?
    struct Section: Decodable, Identifiable { var id: String; var title: String?; var paragraphs: [String]? }
    struct Source: Decodable, Identifiable { var id: Int; var text: String?; var url: String? }
}
