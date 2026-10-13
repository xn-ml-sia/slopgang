import Foundation

/// FNV-1a 32-bit over UTF-16 code units, same as `hash()` in FeedWall.tsx.
func fnv1a(_ s: String) -> UInt32 {
    var h: UInt32 = 2166136261
    for u in s.utf16 { h = (h ^ UInt32(u)) &* 16777619 }
    return h
}

/// mulberry32, same as `rand()` in FeedWall.tsx, so plates land where they do on the site.
final class SeededRandom {
    private var a: UInt32
    init(seed: UInt32) { a = seed == 0 ? 1 : seed }
    func next() -> Double {
        a = a &+ 0x6d2b79f5
        var t = (a ^ (a >> 15)) &* (1 | a)
        t = (t &+ ((t ^ (t >> 7)) &* (61 | t))) ^ t
        return Double(t ^ (t >> 14)) / 4294967296
    }
}
