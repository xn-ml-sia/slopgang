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

/// The spiral mark, drawn natively (site: public/logo-spiral.svg is approximated, not traced).
struct SpiralMark: Shape {
    func path(in r: CGRect) -> Path {
        var p = Path()
        let c = CGPoint(x: r.midX, y: r.midY)
        let turns = 3.0, steps = 180
        let maxR = Double(min(r.width, r.height)) / 2
        for i in 0...steps {
            let t = Double(i) / Double(steps)
            let a = t * turns * 2 * .pi
            let rad = maxR * t
            let pt = CGPoint(x: c.x + rad * cos(a), y: c.y + rad * sin(a))
            if i == 0 { p.move(to: pt) } else { p.addLine(to: pt) }
        }
        return p
    }
}

struct Brand: View {
    var color: Color
    var body: some View {
        HStack(spacing: 8) {
            SpiralMark().stroke(color, lineWidth: 2).frame(width: 22, height: 22)
            Text("slopgang").font(.system(size: 19, weight: .semibold)).foregroundStyle(color)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("slopgang")
    }
}
