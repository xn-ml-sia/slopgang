import SwiftUI

/// Native About page, rendered from https://slopgang.org/about.json (same words as the site).
/// Inline markup in the data: [n] is a citation, **text** is bold.
struct AboutView: View {
    @EnvironmentObject var store: ArchiveStore

    var body: some View {
        ScrollView {
            if let a = store.about {
                VStack(alignment: .leading, spacing: 32) {
                    VStack(alignment: .leading, spacing: 16) {
                        Text(a.title ?? "").font(Theme.heading).accessibilityAddTraits(.isHeader)
                        if let lead = a.lead { Text(rich(lead)).font(Theme.body).lineSpacing(6) }
                    }
                    // Hero artwork, same as the site About page (DotForge cellular, 420px square there).
                    DotForgeView()
                        .aspectRatio(1, contentMode: .fit)
                        .frame(maxWidth: 420)
                        .accessibilityHidden(true)
                    ForEach(a.sections ?? []) { s in
                        VStack(alignment: .leading, spacing: 14) {
                            Text(s.title ?? "").font(Theme.heading).accessibilityAddTraits(.isHeader)
                            ForEach(Array((s.paragraphs ?? []).enumerated()), id: \.offset) { _, p in
                                Text(rich(p)).font(Theme.body).lineSpacing(6).fixedSize(horizontal: false, vertical: true)
                            }
                        }
                    }
                    if let src = a.sources, !src.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Sources").font(Theme.heading).accessibilityAddTraits(.isHeader)
                            ForEach(src) { s in
                                HStack(alignment: .firstTextBaseline, spacing: 8) {
                                    Text("\(s.id).").monospacedDigit()
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(s.text ?? "")
                                        if let u = s.url, let url = URL(string: u) { Link(u, destination: url) }
                                    }
                                }
                                .font(Theme.meta)
                            }
                        }
                    }
                }
                .padding(Theme.pad)
                .padding(.bottom, 40)
                .frame(maxWidth: .infinity, alignment: .leading)
            } else {
                Text("Loading.").font(Theme.body).padding(Theme.pad)
            }
        }
        .background(Theme.paper)
        .foregroundStyle(Theme.ink)
        .preferredColorScheme(.light)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { HeaderBrand() }
    }

    /// Turns "[5]" into a superscript number and "**x**" into bold.
    private func rich(_ s: String) -> AttributedString {
        var out = AttributedString()
        var rest = Substring(s)
        let pattern = try! Regex(#"\[(\d+)\]|\*\*([^*]+)\*\*"#)
        while let m = rest.firstMatch(of: pattern) {
            out += AttributedString(String(rest[..<m.range.lowerBound]))
            if let n = m.output[1].substring {
                var c = AttributedString(String(n))
                c[AttributeScopes.SwiftUIAttributes.BaselineOffsetAttribute.self] = 7
                c[AttributeScopes.SwiftUIAttributes.FontAttribute.self] = Font.system(size: 12, weight: .semibold)
                out += c
            } else if let b = m.output[2].substring {
                var c = AttributedString(String(b))
                c.inlinePresentationIntent = .stronglyEmphasized
                out += c
            }
            rest = rest[m.range.upperBound...]
        }
        out += AttributedString(String(rest))
        return out
    }
}
