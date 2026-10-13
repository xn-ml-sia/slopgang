import SwiftUI

/// One type scale, black and white, square corners, no dividers.
/// The site uses Inter; the app uses the system font (SF Pro), which has close metrics.
enum Theme {
    /// Every heading on a page uses this one size (site: 36px desktop, 24px phone).
    static let heading = Font.system(size: 24, weight: .semibold)
    /// Body copy. Site body is 21px on desktop; 19pt reads the same on an iPhone. Scales with Dynamic Type.
    static let body = Font.system(.title3, design: .default)
    static let small = Font.system(size: 13, weight: .medium)
    static let meta = Font.system(size: 15)
    static let ink = Color.black
    static let paper = Color.white
    static let pad: CGFloat = 20
}

/// Small label chip, square corners (site: .glitch-chip).
struct Chip: View {
    var text: String
    var body: some View {
        Text(text.uppercased())
            .font(Theme.small)
            .tracking(0.6)
            .padding(.horizontal, 8).padding(.vertical, 4)
            .overlay(Rectangle().stroke(Theme.ink, lineWidth: 1))
    }
}

/// Small grey kicker label (site: .kicker).
struct Kicker: View {
    var text: String
    var body: some View { Text(text).font(Theme.small).foregroundStyle(.secondary) }
}

/// Text-only nav button: no fill, no stroke.
struct TextButtonStyle: ButtonStyle {
    var color: Color
    func makeBody(configuration: Configuration) -> some View {
        configuration.label.font(.system(size: 17, weight: .medium))
            .foregroundStyle(color.opacity(configuration.isPressed ? 0.5 : 1))
    }
}

/// Site header brand: the Spiral mark (public/logo-spiral.svg, the same path the site's SiteNav
/// draws in currentColor) plus the wordmark. Site CSS: .brand__logo height 1.9rem (30.4px),
/// gap 0.6rem (9.6px), wordmark --t0 (17px), weight 850. White on home, black elsewhere.
struct Brand: View {
    var color: Color
    var body: some View {
        HStack(spacing: 9.6) {
            Image("SpiralLogo")
                .renderingMode(.template)
                .resizable()
                .scaledToFit()
                .frame(width: 30.4, height: 30.4)
            Text("slopgang").font(.system(size: 17, weight: .heavy)).foregroundStyle(color)
        }
        .foregroundStyle(color)
        .frame(height: 40)          // .brand height 2.5rem
        .accessibilityElement(children: .combine)
        .accessibilityLabel("slopgang")
    }
}
