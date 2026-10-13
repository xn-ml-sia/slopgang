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
        // DEBUG screenshots: -scrollEnd opens the page scrolled to the caption.
        .defaultScrollAnchor(ProcessInfo.processInfo.arguments.contains("-scrollEnd") ? .bottom : .top)
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

/// Glitch loading: the 256px thumbnail shows at once as coarse macroblocks (quantized colour);
/// when the full image arrives it sharpens in block by block, like a broken JPEG filling in.
/// Reduce Motion: the plain thumbnail, then a short fade to the full image.
struct RemoteImage: View {
    var url: URL?
    var placeholder: URL?
    @State private var coarse: UIImage?
    @State private var thumb: UIImage?
    @State private var full: UIImage?
    @State private var revealStart: Date?
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    private let cols = 18
    private let revealDuration = 0.5

    var body: some View {
        ZStack {
            if reduceMotion {
                if let thumb { Image(uiImage: thumb).resizable().scaledToFit() }
                if let full { Image(uiImage: full).resizable().scaledToFit().transition(.opacity) }
            } else {
                if let coarse, full == nil || revealStart != nil {
                    Image(uiImage: coarse).resizable().interpolation(.none).scaledToFit()
                }
                if let full {
                    TimelineView(.animation(paused: revealDone)) { tl in
                        let k = progress(tl.date)
                        Image(uiImage: full).resizable().scaledToFit()
                            .mask { BlockMask(cols: cols, aspect: full.size.height / max(1, full.size.width), k: k) }
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .task(id: url) {
            if full == nil, let ph = await ImageLoader.shared.image(placeholder) {
                thumb = ph
                coarse = Macroblock.coarse(ph, cols: cols)
            }
            if let f = await ImageLoader.shared.image(url) {
                if reduceMotion { withAnimation(.easeOut(duration: 0.25)) { full = f } }
                else { revealStart = thumb == nil ? nil : Date(); full = f }
            }
        }
    }

    private var revealDone: Bool { revealStart.map { Date().timeIntervalSince($0) > revealDuration } ?? true }
    private func progress(_ d: Date) -> Double {
        guard let s = revealStart else { return 1 }
        return min(1, d.timeIntervalSince(s) / revealDuration)
    }
}

/// Mask of the blocks revealed so far (fixed random order).
private struct BlockMask: View {
    var cols: Int
    var aspect: CGFloat
    var k: Double
    var body: some View {
        Canvas { ctx, size in
            guard k < 1 else { ctx.fill(Path(CGRect(origin: .zero, size: size)), with: .color(.black)); return }
            // The image is aspect-fit inside `size`; lay the grid over the fitted rect.
            let fw = min(size.width, size.height / max(0.01, aspect)), fh = fw * aspect
            let r = CGRect(x: (size.width - fw) / 2, y: (size.height - fh) / 2, width: fw, height: fh)
            let rows = max(1, Int((CGFloat(cols) * aspect).rounded()))
            let bw = r.width / CGFloat(cols), bh = r.height / CGFloat(rows)
            var p = Path()
            for y in 0..<rows { for x in 0..<cols where Macroblock.order(x, y) < k {
                p.addRect(CGRect(x: r.minX + CGFloat(x) * bw, y: r.minY + CGFloat(y) * bh, width: bw + 0.5, height: bh + 0.5))
            } }
            ctx.fill(p, with: .color(.black))
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
