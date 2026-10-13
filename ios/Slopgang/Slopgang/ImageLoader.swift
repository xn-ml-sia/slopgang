import UIKit
import CoreImage
import ImageIO

/// Downloads images (WebP decodes natively on iOS 14+) and computes the mean color with Core Image.
actor ImageLoader {
    static let shared = ImageLoader()
    private var cache: [URL: UIImage] = [:]
    private let ci = CIContext(options: [.workingColorSpace: NSNull()])

    func image(_ url: URL?) async -> UIImage? {
        guard let url else { return nil }
        if let i = cache[url] { return i }
        guard let (d, r) = try? await ArchiveStore.session.data(from: url),
              (r as? HTTPURLResponse)?.statusCode == 200,
              let ready = Self.decode(d) else { return nil }
        cache[url] = ready
        return ready
    }

    /// Decodes with ImageIO into a plain 8-bit bitmap up front. UIImage.preparingForDisplay()
    /// logged "Error -17102 decompressing image" for these WebP files on iOS 27, so it is not used.
    nonisolated static func decode(_ data: Data) -> UIImage? {
        guard let src = CGImageSourceCreateWithData(data as CFData, nil),
              let cg = CGImageSourceCreateImageAtIndex(src, 0, [kCGImageSourceShouldCacheImmediately: true] as CFDictionary)
        else { return nil }
        return UIImage(cgImage: cg)
    }

    /// Mean RGB of the image via CIAreaAverage, returned as HSL (h 0-360, s 0-1, l 0-1).
    func meanHSL(_ img: UIImage) -> (Double, Double, Double)? {
        guard let cg = img.cgImage else { return nil }
        let input = CIImage(cgImage: cg)
        guard let f = CIFilter(name: "CIAreaAverage", parameters: [kCIInputImageKey: input, kCIInputExtentKey: CIVector(cgRect: input.extent)]),
              let out = f.outputImage else { return nil }
        var px = [UInt8](repeating: 0, count: 4)
        ci.render(out, toBitmap: &px, rowBytes: 4, bounds: CGRect(x: 0, y: 0, width: 1, height: 1), format: .RGBA8, colorSpace: nil)
        return Self.rgbToHsl(Double(px[0]) / 255, Double(px[1]) / 255, Double(px[2]) / 255)
    }

    /// Same formula as FeedWall.tsx rgbToHsl.
    static func rgbToHsl(_ r: Double, _ g: Double, _ b: Double) -> (Double, Double, Double) {
        let mx = max(r, g, b), mn = min(r, g, b)
        let l = (mx + mn) / 2
        let d = mx - mn
        guard d > 0 else { return (0, 0, l) }
        let s = d / (1 - abs(2 * l - 1))
        let h: Double
        if mx == r { h = ((g - b) / d + 6).truncatingRemainder(dividingBy: 6) * 60 }
        else if mx == g { h = ((b - r) / d + 2) * 60 }
        else { h = ((r - g) / d + 4) * 60 }
        return (h, min(1, s), l)
    }

    /// Same seeded fallback as the site when a thumbnail fails.
    static func fallbackHSL(_ id: String) -> (Double, Double, Double) {
        let r = SeededRandom(seed: fnv1a("c-" + id))
        return (r.next() * 360, 0.3, 0.3 + r.next() * 0.4)
    }
}
