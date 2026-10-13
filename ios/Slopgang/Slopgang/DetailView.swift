import SwiftUI

/// Port of src/pages/Specimen.tsx. Paper page: black on white, square corners, no dividers.
struct DetailView: View {
    @EnvironmentObject var store: ArchiveStore
    var slug: String
    var open: (Plate) -> Void

    var body: some View {
        Group {
            if let p = store.plate(slug) { content(p) }
            else { Text("This plate is not in the archive.").font(Theme.body).padding(Theme.pad) }
        }
        .background(Theme.paper)
        .foregroundStyle(Theme.ink)
        .preferredColorScheme(.light)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            HeaderBrand()
            ToolbarItem(placement: .topBarTrailing) {
                ShareLink(item: URL(string: "https://slopgang.org/specimen/\(slug)") ?? ArchiveStore.base) {
                    Image(systemName: "square.and.arrow.up")
                }
            }
        }
    }

    @ViewBuilder private func content(_ p: Plate) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                MediaPlate(plate: p)
                VStack(alignment: .leading, spacing: 14) {
                    if let g = p.glitchTypeLabel {
                        HStack(spacing: 8) {
                            if p.kind == .pair, let l = p.pairLabel { Chip(text: "\(l) pair") }
                            Chip(text: g)
                        }
                    }
                    Text(p.shortTitle).font(Theme.heading).accessibilityAddTraits(.isHeader)
                }
                .padding(.horizontal, Theme.pad)

                if p.kind == .pair, let r = p.researcher, let a = p.artist {
                    VStack(alignment: .leading, spacing: 16) {
                        HStack(alignment: .top, spacing: 16) {
                            PairColumn(label: "Research", side: r)
                            PairColumn(label: "Art", side: a)
                        }
                        if let e = p.evidence { Text(e).font(Theme.meta) }
                    }
                    .padding(.horizontal, Theme.pad)
                }

                VStack(alignment: .leading, spacing: 18) {
                    if p.paragraphs.isEmpty {
                        Text("Essay forthcoming. The plate is logged; the sleeve note is still on the bench.").font(Theme.body)
                    }
                    ForEach(Array(p.paragraphs.enumerated()), id: \.offset) { _, para in
                        Text(para).font(Theme.body).lineSpacing(6).fixedSize(horizontal: false, vertical: true)
                    }
                    if let img = p.image {
                        VStack(alignment: .leading, spacing: 4) {
                            Text([img.credit, img.license].compactMap { $0 }.joined(separator: " ")).font(Theme.meta).foregroundStyle(.secondary)
                            if let l = img.link, let u = URL(string: l) { Link("See the work →", destination: u).font(Theme.meta) }
                        }
                    }
                    RelatedSection(plate: p, open: open)
                    if let s = p.sources, !s.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Sources").font(Theme.heading).accessibilityAddTraits(.isHeader)
                            ForEach(Array(s.enumerated()), id: \.offset) { i, u in
                                if let url = URL(string: u) {
                                    Link(destination: url) {
                                        HStack(alignment: .firstTextBaseline, spacing: 8) {
                                            Text("\(i + 1).").monospacedDigit()
                                            Text(u.replacingOccurrences(of: #"^https?://(www\.)?"#, with: "", options: .regularExpression))
                                                .multilineTextAlignment(.leading)
                                        }.font(Theme.meta)
                                    }
                                }
                            }
                        }
                    }
                    if let s = p.url, let u = URL(string: s) {
                        Link("Source →", destination: u).font(.system(size: 17, weight: .semibold))
                    }
                    // Caption and metadata sit at the end of the page.
                    VStack(alignment: .leading, spacing: 16) {
                        if let c = p.caption { Text(c).font(Theme.meta).fixedSize(horizontal: false, vertical: true) }
                        MetaGrid(rows: [("Logged", p.loggedDate), ("Catalogue", p.catalogue),
                                        ("Register", p.register), ("Logged by", p.loggedBy ?? p.author ?? "")])
                    }
                    .padding(.top, 8)
                }
                .padding(.horizontal, Theme.pad)
                .padding(.bottom, 40)
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
        .background(Color.black)
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
    private let columns = [GridItem(.flexible(), spacing: 16, alignment: .topLeading),
                           GridItem(.flexible(), spacing: 16, alignment: .topLeading)]
    var body: some View {
        LazyVGrid(columns: columns, alignment: .leading, spacing: 14) {
            ForEach(Array(rows.enumerated()), id: \.offset) { _, row in
                VStack(alignment: .leading, spacing: 2) {
                    Kicker(text: row.0)
                    Text(row.1).font(Theme.meta)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .accessibilityElement(children: .combine)
            }
        }
        .frame(maxWidth: .infinity)
    }
}

private struct PairColumn: View {
    var label: String
    var side: Plate.PairSide
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Kicker(text: label)
            Group {
                if let s = side.url, let u = URL(string: s) { Link(side.work ?? "", destination: u) }
                else { Text(side.work ?? "") }
            }
            .font(Theme.heading).multilineTextAlignment(.leading).accessibilityAddTraits(.isHeader)
            Text([side.name, side.year].compactMap { $0 }.joined(separator: ", ")).font(Theme.meta)
            if let h = side.handle, side.handleVerified == true, let u = URL(string: "https://x.com/\(h)") {
                Link("@\(h)", destination: u).font(Theme.meta)
            }
        }
        .frame(maxWidth: .infinity, alignment: .topLeading)
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
                Text(forward.isEmpty ? "Glitch pair" : "Related plates").font(Theme.heading).accessibilityAddTraits(.isHeader)
                ForEach(links, id: \.0.id) { link in
                    let p = link.0, reason = link.1
                    Button { open(p) } label: {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("\(p.catalogue) \(p.shortTitle)").font(.system(size: 17, weight: .semibold)).underline()
                            if !reason.isEmpty { Text(reason).font(Theme.meta).foregroundStyle(.secondary) }
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
