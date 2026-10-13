import SwiftUI

/// Native About page, rendered from https://slopgang.org/about.json (same words as the site).
/// Inline markup in the data: [n] is a citation, **text** is bold.
struct AboutView: View {
    @EnvironmentObject var store: ArchiveStore

    var body: some View {
        ScrollView {
            if let a = store.about {
                VStack(alignment: .leading, spacing: Theme.rhythm) {   // .section padding-block
                    VStack(alignment: .leading, spacing: 26) {   // .hero .lead margin-top 26
                        Text(a.title ?? "").textStyle(.heading).accessibilityAddTraits(.isHeader)
                        if let lead = a.lead { Text(rich(lead, strongInk: true)).textStyle(.lead).frame(maxWidth: 46 * 0.631 * Theme.t0, alignment: .leading) }
                    }
                    // Hero artwork, same as the site About page (DotForge cellular, 420px square there).
                    DotForgeView()
                        .aspectRatio(1, contentMode: .fit)
                        .frame(maxWidth: 420)
                        .accessibilityHidden(true)
                    ForEach(a.sections ?? []) { s in
                        VStack(alignment: .leading, spacing: Theme.sectionHeadGap) {
                            Text(s.title ?? "").textStyle(.heading).accessibilityAddTraits(.isHeader)
                            ForEach(Array((s.paragraphs ?? []).enumerated()), id: \.offset) { _, p in
                                Text(rich(p)).textStyle(.body).fixedSize(horizontal: false, vertical: true).frame(maxWidth: Theme.measure, alignment: .leading)
                            }
                        }
                    }
                    if let src = a.sources, !src.isEmpty {
                        VStack(alignment: .leading, spacing: Theme.sectionHeadGap) {
                            Text("Sources").textStyle(.heading).accessibilityAddTraits(.isHeader)
                            ForEach(src) { s in
                                HStack(alignment: .firstTextBaseline, spacing: 8) {
                                    Text("\(s.id).").monospacedDigit()
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(s.text ?? "")
                                        if let u = s.url, let url = URL(string: u) { Link(u, destination: url) }
                                    }
                                }
                                .textStyle(.meta)
                                .padding(.bottom, 8 - 2)   // li margin-bottom 8
                            }
                        }
                    }
                }
                .padding(.horizontal, Theme.gutter)
                .padding(.vertical, Theme.spaceS)
                .padding(.bottom, Theme.rhythm)
                .frame(maxWidth: .infinity, alignment: .leading)
            } else {
                Text("Loading.").textStyle(.body).padding(Theme.gutter)
            }
        }
        .background(Theme.paper)
        .foregroundStyle(Theme.ink)
        .preferredColorScheme(.light)
        .navigationBarTitleDisplayMode(.inline)
        .navigationBarBackButtonHidden(true)
        .toolbar { HeaderBrand() }
    }

    /// Turns "[5]" into a superscript number and "**x**" into bold.
    private func rich(_ s: String, strongInk: Bool = false) -> AttributedString {
        var out = AttributedString()
        var rest = Substring(s)
        let pattern = try! Regex(#"\[(\d+)\]|\*\*([^*]+)\*\*"#)
        while let m = rest.firstMatch(of: pattern) {
            out += AttributedString(String(rest[..<m.range.lowerBound]))
            if let n = m.output[1].substring {
                var c = AttributedString(String(n))
                c[AttributeScopes.SwiftUIAttributes.BaselineOffsetAttribute.self] = 7
                c[AttributeScopes.SwiftUIAttributes.FontAttribute.self] = Theme.inter(Theme.body * 0.6)   // sup.cite 0.6em
                out += c
            } else if let b = m.output[2].substring {
                var c = AttributedString(String(b))
                // .hero .lead strong: ink, weight 500
                c[AttributeScopes.SwiftUIAttributes.FontAttribute.self] = Theme.inter(Theme.t0, .medium)
                if strongInk { c[AttributeScopes.SwiftUIAttributes.ForegroundColorAttribute.self] = Theme.ink }
                out += c
            }
            rest = rest[m.range.upperBound...]
        }
        out += AttributedString(String(rest))
        return out
    }
}
