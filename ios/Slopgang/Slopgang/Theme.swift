import SwiftUI
import UIKit

/// Design tokens taken from the site CSS (src/index.css v10 to v15b, src/specimen.css, src/about-hero.css).
/// CSS px map 1:1 to pt. Sizes that the site writes as clamp(min, a + b*vw, max) are evaluated with
/// the device width as vw, so an iPhone gets the site's own mobile values (clamp minimums on most phones).
enum Theme {
    // MARK: Viewport
    /// Device width in pt, used as the CSS viewport width.
    static let vw: CGFloat = {
        let w = (UIApplication.shared.connectedScenes.first as? UIWindowScene)?.screen.bounds.width ?? 390
        return min(w, (UIApplication.shared.connectedScenes.first as? UIWindowScene)?.screen.bounds.height ?? w)
    }()
    static let rem: CGFloat = 16
    /// CSS clamp(min, base + perVw * 1vw, max).
    static func clamp(_ lo: CGFloat, _ base: CGFloat, _ perVw: CGFloat, _ hi: CGFloat) -> CGFloat {
        min(hi, max(lo, base + perVw * vw / 100))
    }

    // MARK: Colors (v10 :root, home overrides, specimen.css)
    static let paper = Color.white                       // --paper #fff (detail, About)
    static let paper2 = Color(white: 0xf2 / 255.0)       // --paper-2 #f2f2f2
    static let ink = Color.black                         // --ink #000
    static let muted = Color(white: 0x55 / 255.0)        // --muted #555
    static let rule = Color.black                        // --rule #000 (used only for link-arrow underline)
    static let homeBackground = Color.black              // .cloud background #000
    static let homeInk = Color.white                     // .feed:has(.cloud) .brand and nav #fff
    static let mediaBackground = Color(white: 0x11 / 255.0) // .specimen-media img/video #111
    static let tipBackground = Color.white               // .cloud-tip #fff
    static let chipBackground = ink                      // .glitch-chip background var(--ink)
    static let chipInk = paper                           // .glitch-chip color var(--paper)
    static let citeTarget = Color.black.opacity(0.06)    // .about-sources li:target

    // MARK: Type scale
    static let tMinus1 = clamp(0.72 * rem, 0.68 * rem, 0.2, 0.82 * rem)   // --t-1: meta, labels, nav
    static let t0 = clamp(1 * rem, 0.94 * rem, 0.3, 1.18 * rem)           // --t0: deck, lead, brand, related
    static let sectionTitle = clamp(1.5 * rem, 1.1 * rem, 1.6, 2.25 * rem) // --section-title-size (24 phone, 36 desktop)
    static let pageTitle = sectionTitle                                    // v15: page title = section title
    static let body = clamp(1.05 * rem, 0.98 * rem, 0.4, 1.3125 * rem)     // --body-size (about 17 phone, 21 desktop)
    static let chip: CGFloat = 0.8125 * rem                                 // .glitch-chip 13px
    static let credit: CGFloat = 1 * rem                                    // .specimen-credit, .specimen-sources 16px
    static let brandMark: CGFloat = 1.9 * rem                               // .brand__logo 30.4px
    static let brandGap: CGFloat = 0.6 * rem                                // .brand gap 9.6px
    static let brandHeight: CGFloat = 2.5 * rem                             // .brand height 40px

    static let headingLineHeight: CGFloat = 1.05      // --section-title-lh
    static let bodyLineHeight: CGFloat = 1.5          // --body-lh
    static let deckLineHeight: CGFloat = 1.5          // .specimen-deck, .pair-evidence, .related li
    static let leadLineHeight: CGFloat = 1.55         // .hero .lead
    static let sourcesLineHeight: CGFloat = 1.6       // .specimen-sources
    static let tipLineHeight: CGFloat = 1.3           // .cloud-tip-label

    static let headingTracking: CGFloat = -0.03       // em, --section-title-tracking
    static let bodyTracking: CGFloat = -0.01          // em, --body-tracking
    static let chipTracking: CGFloat = 0.06           // em, .glitch-chip

    /// --content-measure 72ch. One ch in Inter is 0.631 em ("0" advance). Wider than any phone,
    /// so on iPhone text runs gutter to gutter; the cap matters on iPad.
    static let measure: CGFloat = 72 * 0.631 * body

    // MARK: Spacing
    static let gutter = clamp(1.5 * rem, 0, 6, 7 * rem)        // --gutter: 24 on phones
    static let rhythm = clamp(72, 0, 9, 120)                    // --rhythm: section padding
    static let space2xs: CGFloat = 0.5 * rem                     // 8
    static let spaceXs: CGFloat = 0.875 * rem                    // 14
    static let spaceS: CGFloat = 1.5 * rem                       // 24
    static let spaceM: CGFloat = 2.5 * rem                       // 40
    static let spaceL: CGFloat = 5 * rem                         // 80
    static let navPadding: CGFloat = 14                          // .feed-nav mobile padding 14px
    static let sectionHeadGap = clamp(32, 0, 4, 56)              // .section-head margin-bottom
    static let layoutGap = clamp(28, 0, 4, 56)                   // .specimen-layout gap
    static let essayTop = clamp(40, 0, 5, 72)                    // .specimen-essay-wrap padding-top
    static let essayBottom = clamp(48, 0, 6, 88)                 // .specimen-essay-wrap padding-bottom
    static let tagsGap: CGFloat = 10                             // .glitch-tags gap
    static let specsGap = (row: CGFloat(20), col: CGFloat(32))   // .specimen-specs mobile grid gap
    static let line: CGFloat = 2                                 // --line
    static let radius: CGFloat = 0                               // square corners everywhere

    // Legacy names used by older call sites.
    static var pad: CGFloat { gutter }
    static var heading: Font { font(.heading) }
    static var meta: Font { font(.meta) }
    static var small: Font { font(.meta) }

    // MARK: Fonts
    /// Bundled Inter static weights (OFL). Site weight 850 uses ExtraBold (800), the nearest static cut.
    private static func interName(_ w: Font.Weight) -> String {
        switch w {
        case .medium: return "Inter-Medium"
        case .semibold: return "Inter-SemiBold"
        case .bold, .heavy, .black: return "Inter-ExtraBold"
        default: return "Inter-Regular"
        }
    }
    static func inter(_ size: CGFloat, _ weight: Font.Weight = .regular) -> Font {
        let name = interName(weight)
        if UIFont(name: name, size: size) != nil { return Font.custom(name, fixedSize: size).monospacedDigit() }
        return Font.system(size: size, weight: weight).monospacedDigit()   // body uses tnum on the site
    }
    /// --mono: JetBrains Mono (OFL), used by .kicker and .specs dt.
    static func mono(_ size: CGFloat, _ weight: Font.Weight = .regular) -> Font {
        let name = weight == .medium ? "JetBrainsMono-Medium" : "JetBrainsMono-Regular"
        if UIFont(name: name, size: size) != nil { return Font.custom(name, fixedSize: size) }
        return Font.system(size: size, weight: weight, design: .monospaced)
    }

    enum Style {
        case heading, body, lead, deck, meta, label, chip, credit, sources, brand, nav, linkTitle, tipTitle, tipCaption
    }

    static func size(_ s: Style) -> CGFloat {
        switch s {
        case .heading: return sectionTitle
        case .body: return body
        case .lead, .deck, .brand, .linkTitle: return t0
        case .meta, .label, .nav, .tipTitle, .tipCaption: return tMinus1
        case .chip: return chip
        case .credit, .sources: return credit
        }
    }

    static func font(_ s: Style) -> Font {
        switch s {
        case .heading: return inter(sectionTitle, .semibold)        // weight 600
        case .body, .lead, .deck, .meta, .credit, .sources, .tipCaption: return inter(size(s))
        case .label: return mono(tMinus1)                            // .kicker / dt
        case .chip: return inter(chip)
        case .brand: return inter(t0, .heavy)                        // 850
        case .nav, .tipTitle: return inter(tMinus1, .semibold)       // 600
        case .linkTitle: return inter(t0)
        }
    }

    static func lineHeight(_ s: Style) -> CGFloat {
        switch s {
        case .heading: return headingLineHeight
        case .body, .deck, .linkTitle, .meta: return bodyLineHeight
        case .lead: return leadLineHeight
        case .sources: return sourcesLineHeight
        case .tipTitle, .tipCaption: return tipLineHeight
        default: return 1.2
        }
    }

    static func tracking(_ s: Style) -> CGFloat {
        switch s {
        case .heading: return headingTracking * sectionTitle
        case .body: return bodyTracking * body
        case .chip: return chipTracking * chip
        default: return 0
        }
    }

    static func color(_ s: Style) -> Color {
        switch s {
        case .lead, .deck, .label, .sources: return muted
        default: return ink
        }
    }
}

extension View {
    /// Font, line height, letter-spacing and color for one site text style.
    func textStyle(_ s: Theme.Style, color: Color? = nil) -> some View {
        let size = Theme.size(s)
        return self
            .font(Theme.font(s))
            .tracking(Theme.tracking(s))
            .lineSpacing(max(0, (Theme.lineHeight(s) - 1.2) * size))   // SwiftUI already adds about 1.2 em
            .foregroundStyle(color ?? Theme.color(s))
    }
}

/// .glitch-chip: ink fill, paper text, 13px uppercase, 0.06em tracking, 4px 8px padding, square.
struct Chip: View {
    var text: String
    var body: some View {
        Text(text.uppercased())
            .textStyle(.chip, color: Theme.chipInk)
            .padding(.horizontal, 8).padding(.vertical, 4)
            .background(Rectangle().fill(Theme.chipBackground))
    }
}

/// .kicker and .specs dt: mono, --t-1, muted.
struct Kicker: View {
    var text: String
    var body: some View { Text(text).textStyle(.label) }
}

/// Detail header button: white fill, black icon, square corners, site nav padding
/// (0.35rem x 0.8rem), so it reads over media.
struct FilledNavButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(Theme.font(.nav))
            .foregroundStyle(Theme.ink)
            .padding(.vertical, 0.35 * Theme.rem).padding(.horizontal, 0.8 * Theme.rem)
            .background(Rectangle().fill(Theme.paper))
            .opacity(configuration.isPressed ? 0.7 : 1)
            .contentShape(Rectangle())
    }
}

/// Text-only nav button (site nav links: --t-1, weight 600, no fill, no stroke).
struct TextButtonStyle: ButtonStyle {
    var color: Color
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(Theme.font(.nav))
            .padding(.vertical, 0.35 * Theme.rem).padding(.horizontal, 0.8 * Theme.rem)
            .foregroundStyle(color)
            .underline(configuration.isPressed)          // site: underline on hover
    }
}

/// Site header brand: the Spiral mark (public/logo-spiral.svg, the same path the site's SiteNav
/// draws in currentColor) plus the wordmark. Site CSS: .brand__logo height 1.9rem (30.4px),
/// gap 0.6rem (9.6px), wordmark --t0 (17px), weight 850. White on home, black elsewhere.
struct Brand: View {
    var color: Color
    var wordmark = true
    var body: some View {
        HStack(spacing: Theme.brandGap) {
            Image("SpiralLogo")
                .renderingMode(.template)
                .resizable()
                .scaledToFit()
                .frame(width: Theme.brandMark, height: Theme.brandMark)
            if wordmark { Text("slopgang").font(Theme.font(.brand)).foregroundStyle(color) }
        }
        .foregroundStyle(color)
        .frame(height: Theme.brandHeight)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("slopgang")
    }
}
