import SwiftUI

/// Port of src/pages/Specimen.tsx. Paper page: black on white, square corners, no dividers.
struct DetailView: View {
    @EnvironmentObject var store: ArchiveStore
    var slug: String
    var open: (Plate) -> Void

    var body: some View {
        Group {
            if let p = store.plate(slug) { content(p) }
            else { Text("This plate is not in the archive.").textStyle(.body).padding(Theme.gutter) }
        }
        .background(Theme.paper)
        .foregroundStyle(Theme.ink)
        .preferredColorScheme(.light)
        .navigationBarTitleDisplayMode(.inline)
        .navigationBarBackButtonHidden(true)
        .toolbar {
            HeaderBrand(showBrand: false)
            ToolbarItem(placement: .topBarTrailing) {
                ShareLink(item: URL(string: "https://slopgang.org/specimen/\(slug)") ?? ArchiveStore.base) {
                    Image(systemName: "square.and.arrow.up").font(.system(size: 15, weight: .semibold))
                }
                .buttonStyle(FilledNavButtonStyle())
                .accessibilityLabel("Share")
            }
            .plainToolbarBackground()
        }
    }

    @ViewBuilder private func content(_ p: Plate) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.layoutGap) {
                MediaPlate(plate: p)
                VStack(alignment: .leading, spacing: 16) {   // .glitch-tags margin-bottom 16
                    if let g = p.glitchTypeLabel {
                        HStack(spacing: Theme.tagsGap) {
                            if p.kind == .pair, let l = p.pairLabel { Chip(text: "\(l) pair") }
                            Chip(text: g)
                        }
                    }
                    Text(p.shortTitle).textStyle(.heading).accessibilityAddTraits(.isHeader)
                }
                .padding(.horizontal, Theme.gutter)

                if p.kind == .pair, let r = p.researcher, let a = p.artist {
                    VStack(alignment: .leading, spacing: 16) {
                        PairCarousel(sides: [("Research", r), ("Art", a)])
                        if let e = p.evidence {
                            Text(e).textStyle(.deck, color: Theme.muted).frame(maxWidth: Theme.measure, alignment: .leading)
                                .padding(.horizontal, Theme.gutter)
                        }
                    }
                }

                VStack(alignment: .leading, spacing: 1.15 * Theme.body) {   // p margin-top 1.15em
                    if p.paragraphs.isEmpty {
                        Text("Essay forthcoming. The plate is logged; the sleeve note is still on the bench.").textStyle(.body)
                    }
                    ForEach(Array(p.paragraphs.enumerated()), id: \.offset) { _, para in
                        Text(para).textStyle(.body).fixedSize(horizontal: false, vertical: true)
                    }
                    if let img = p.image {
                        VStack(alignment: .leading, spacing: 4) {
                            Text([img.credit, img.license].compactMap { $0 }.joined(separator: " ")).textStyle(.credit)
                            if let l = img.link, let u = URL(string: l) { Link("See the work →", destination: u).textStyle(.credit) }
                        }
                    }
                    RelatedSection(plate: p, open: open)
                    if let s = p.sources, !s.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Sources").textStyle(.heading).accessibilityAddTraits(.isHeader)
                            ForEach(Array(s.enumerated()), id: \.offset) { i, u in
                                if let url = URL(string: u) {
                                    Link(destination: url) {
                                        HStack(alignment: .firstTextBaseline, spacing: 8) {
                                            Text("\(i + 1).").monospacedDigit()
                                            Text(u.replacingOccurrences(of: #"^https?://(www\.)?"#, with: "", options: .regularExpression))
                                                .multilineTextAlignment(.leading)
                                        }.textStyle(.sources)
                                    }
                                }
                            }
                        }
                    }
                    if let s = p.url, let u = URL(string: s) {
                        Link(destination: u) {
                            Text("Source →").font(Theme.inter(Theme.tMinus1, .medium)).foregroundStyle(Theme.ink)
                                .padding(.bottom, 2)
                                .overlay(alignment: .bottom) { Rectangle().fill(Theme.rule).frame(height: 1) }   // .link-arrow
                        }
                    }
                    // Caption and metadata sit at the end of the page.
                    VStack(alignment: .leading, spacing: 16) {
                        if let c = p.caption { Text(c).textStyle(.deck).fixedSize(horizontal: false, vertical: true) }
                        MetaGrid(rows: [("Logged", p.loggedDate), ("Catalogue", p.catalogue),
                                        ("Register", p.register), ("Logged by", p.loggedBy ?? p.author ?? "")])
                    }
                    .padding(.top, 8)
                }
                .frame(maxWidth: Theme.measure, alignment: .leading)
                .padding(.horizontal, Theme.gutter)
                .padding(.top, Theme.essayTop - Theme.layoutGap)
                .padding(.bottom, Theme.essayBottom)
            }
        }
    }
}

private struct MediaPlate: View {
    var plate: Plate
    var body: some View {
        let w = plate.media?.width ?? 4, h = plate.media?.height ?? 3
        Group {
            if plate.isVideo, let u = ArchiveStore.resolve(plate.media?.url) {
                PlayerView(url: u, poster: ArchiveStore.resolve(plate.media?.poster))
            } else {
                RemoteImage(url: ArchiveStore.resolve(plate.stillPath), placeholder: ArchiveStore.resolve(plate.thumbs?.md))
            }
        }
        .aspectRatio(CGFloat(w / max(h, 1)), contentMode: .fit)
        .frame(maxWidth: .infinity)
        .background(Theme.mediaBackground)
        .accessibilityLabel(plate.media?.alt ?? plate.shortTitle)
    }
}

/// Shows the 256px thumbnail at once, then swaps to full resolution with no fade.
struct RemoteImage: View {
    var url: URL?
    var placeholder: URL?
    @State private var image: UIImage?
    var body: some View {
        ZStack {
            if let image { Image(uiImage: image).resizable().scaledToFit() }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .task(id: url) {
            if image == nil, let ph = await ImageLoader.shared.image(placeholder) { image = ph }
            if let full = await ImageLoader.shared.image(url) {
                var t = Transaction(); t.disablesAnimations = true
                withTransaction(t) { image = full }
            }
        }
    }
}

/// Logged / Catalogue / Register / Logged by: two equal columns that span the full width.
private struct MetaGrid: View {
    var rows: [(String, String)]
    private let columns = [GridItem(.flexible(), spacing: Theme.specsGap.col, alignment: .topLeading),
                           GridItem(.flexible(), spacing: Theme.specsGap.col, alignment: .topLeading)]
    var body: some View {
        LazyVGrid(columns: columns, alignment: .leading, spacing: Theme.specsGap.row) {
            ForEach(Array(rows.enumerated()), id: \.offset) { _, row in
                VStack(alignment: .leading, spacing: 4) {
                    Kicker(text: row.0)
                    Text(row.1).textStyle(.meta)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .accessibilityElement(children: .combine)
            }
        }
        .frame(maxWidth: .infinity)
    }
}

/// Researcher and artist as full-width cards, swiped one at a time. Every line in a card is body size.
private struct PairCarousel: View {
    var sides: [(String, Plate.PairSide)]
    @State private var page: Int? = 0
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            ScrollView(.horizontal, showsIndicators: false) {
                LazyHStack(alignment: .top, spacing: 0) {
                    ForEach(Array(sides.enumerated()), id: \.offset) { i, s in
                        PairCard(label: s.0, side: s.1)
                            .padding(.horizontal, Theme.gutter)
                            .containerRelativeFrame(.horizontal)
                            .id(i)
                    }
                }
                .scrollTargetLayout()
            }
            .scrollTargetBehavior(.paging)
            .scrollPosition(id: $page)
            HStack(spacing: 8) {
                ForEach(sides.indices, id: \.self) { i in
                    Circle().fill(i == (page ?? 0) ? Theme.ink : Theme.ink.opacity(0.25)).frame(width: 7, height: 7)
                }
                Text("\((page ?? 0) + 1) / \(sides.count)").textStyle(.body, color: Theme.muted).monospacedDigit()
            }
            .padding(.horizontal, Theme.gutter)
            .accessibilityHidden(true)
        }
    }
}

private struct PairCard: View {
    var label: String
    var side: Plate.PairSide
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label.uppercased()).textStyle(.body, color: Theme.muted)
            Group {
                if let s = side.url, let u = URL(string: s) { Link(side.work ?? "", destination: u).underline() }
                else { Text(side.work ?? "") }
            }
            .textStyle(.body).fontWeight(.semibold).multilineTextAlignment(.leading).accessibilityAddTraits(.isHeader)
            let by = [side.name, side.year].compactMap { $0 }.joined(separator: ", ")
            if !by.isEmpty { Text(by).textStyle(.body) }
            if let h = side.handle, side.handleVerified == true, let u = URL(string: "https://x.com/\(h)") {
                Link("@\(h)", destination: u).textStyle(.body, color: Theme.muted)
            }
            Spacer(minLength: 0)
        }
        .padding(Theme.gutter * 0.75)
        .frame(maxWidth: .infinity, minHeight: 150, alignment: .topLeading)
        .background(Theme.paper2)
        .accessibilityElement(children: .combine)
    }
}

/// Glitch posts show "Related plates"; plates that a glitch post links to show "Glitch pair".
private struct RelatedSection: View {
    @EnvironmentObject var store: ArchiveStore
    var plate: Plate
    var open: (Plate) -> Void
    var body: some View {
        let forward: [(Plate, String)] = (plate.relatedSlop ?? []).compactMap { l in store.plate(l.id).map { ($0, l.reason ?? "") } }
        let reverse = (plate.kind == nil || plate.kind == .slop) ? store.glitchPairs(for: plate) : []
        let links = forward.isEmpty ? reverse : forward
        if !links.isEmpty {
            VStack(alignment: .leading, spacing: 14) {
                Text(forward.isEmpty ? "Glitch pair" : "Related plates").textStyle(.heading).accessibilityAddTraits(.isHeader)
                ForEach(links, id: \.0.id) { link in
                    let p = link.0, reason = link.1
                    Button { open(p) } label: {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("\(p.catalogue) \(p.shortTitle)").textStyle(.linkTitle).underline()
                            if !reason.isEmpty { Text(reason).textStyle(.deck, color: Theme.muted) }
                        }
                        .multilineTextAlignment(.leading)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
}
