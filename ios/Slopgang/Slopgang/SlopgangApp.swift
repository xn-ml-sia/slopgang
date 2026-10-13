import SwiftUI

@main
struct SlopgangApp: App {
    @StateObject private var store = ArchiveStore()
    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(store)
                .task { await store.load() }
        }
    }
}

/// The brand in the header goes home, as the site logo links to "/". `back` pops one page.
struct GoHome { var run: () -> Void = {}; var back: () -> Void = {} }
private struct GoHomeKey: EnvironmentKey { static let defaultValue = GoHome() }
extension EnvironmentValues {
    var goHome: GoHome {
        get { self[GoHomeKey.self] }
        set { self[GoHomeKey.self] = newValue }
    }
}

/// Header brand for paper pages: left side, after the back button, like the site header.
struct HeaderBrand: ToolbarContent {
    @Environment(\.goHome) private var goHome
    var body: some ToolbarContent {
        ToolbarItem(placement: .topBarLeading) {
            HStack(spacing: 4) {
                // Custom back so going back runs the reverse glitch (the system back button cannot).
                Button { goHome.back() } label: {
                    Image(systemName: "chevron.left").font(.system(size: 17, weight: .semibold)).foregroundStyle(Theme.ink)
                        .frame(width: 32, height: 44, alignment: .leading)
                }
                .accessibilityLabel("Back")
                Button { goHome.run() } label: { Brand(color: Theme.ink) }.buttonStyle(.plain)
            }
        }
    }
}

enum Route: Hashable {
    case plate(String)
    case about
}

struct RootView: View {
    @EnvironmentObject var store: ArchiveStore
    @State private var path = NavigationPath()
    @StateObject private var fx = GlitchDirector()
    @Environment(\.scenePhase) private var phase

    var body: some View {
        NavigationStack(path: $path) {
            HomeView(open: { p, rect in fx.push(from: rect) { path.append(Route.plate(p.slugValue)) } },
                     about: { fx.push(from: nil) { path.append(Route.about) } })
                .navigationDestination(for: Route.self) { r in
                    switch r {
                    case .plate(let slug):
                        DetailView(slug: slug, open: { p in fx.push(from: nil) { path.append(Route.plate(p.slugValue)) } })
                    case .about:
                        AboutView()
                    }
                }
        }
        .environment(\.goHome, GoHome(
            run: { if !path.isEmpty { fx.pop { path = NavigationPath() } } },
            back: { if !path.isEmpty { fx.pop { path.removeLast() } } }))
        .tint(.black)
        .onChange(of: phase) { _, p in if p == .active { Task { await store.load() } } }
        .onOpenURL { url in
            // slopgang://specimen/sg-123 or https://slopgang.org/specimen/sg-123
            let parts = url.pathComponents.filter { $0 != "/" }
            if let i = parts.firstIndex(of: "specimen"), i + 1 < parts.count { path.append(Route.plate(parts[i + 1])) }
            else if url.host == "specimen", let s = parts.first { path.append(Route.plate(s)) }
            else if parts.last == "about" || url.host == "about" { path.append(Route.about) }
        }
    }
}

struct HomeView: View {
    @EnvironmentObject var store: ArchiveStore
    var open: (Plate, CGRect?) -> Void
    var about: () -> Void
    @Environment(\.accessibilityVoiceOverEnabled) private var voiceOver

    var body: some View {
        ZStack(alignment: .top) {
            Theme.homeBackground.ignoresSafeArea()
            CloudView(plates: store.plates, onOpen: { p, r in open(p, r) })
                .ignoresSafeArea()
                .accessibilityHidden(true)
            HStack {
                Brand(color: Theme.homeInk)
                Spacer()
                Button("About", action: about).buttonStyle(TextButtonStyle(color: Theme.homeInk))
            }
            .padding(.horizontal, Theme.navPadding).padding(.top, 6)   // site mobile .feed-nav: 14px sides
            if store.plates.isEmpty {
                VStack { Spacer(); Text(store.status ?? "Loading the archive.").textStyle(.meta, color: Theme.homeInk); Spacer() }
            } else if let s = store.status {
                VStack { Spacer(); Text(s).textStyle(.meta, color: Theme.homeInk.opacity(0.7)).padding(.bottom, 12) }
            }
        }
        .toolbar(.hidden, for: .navigationBar)
        .statusBarHidden(false)
        .preferredColorScheme(.dark)
        // VoiceOver users get a plain list over the cloud; the cloud is a visual.
        .overlay { if voiceOver { AccessibleList(open: { open($0, nil) }) } }
    }
}

/// Plain list of plates, shown only when VoiceOver is on.
private struct AccessibleList: View {
    @EnvironmentObject var store: ArchiveStore
    var open: (Plate) -> Void
    var body: some View {
        List(store.plates) { p in
            Button("\(p.catalogue) \(p.shortTitle), \(String((p.timestamp ?? "").prefix(4)))") { open(p) }
        }
        .listStyle(.plain)
        .padding(.top, 52)
    }
}
