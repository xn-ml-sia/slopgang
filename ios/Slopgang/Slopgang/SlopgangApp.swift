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

enum Route: Hashable {
    case plate(String)
    case about
}

struct RootView: View {
    @EnvironmentObject var store: ArchiveStore
    @State private var path = NavigationPath()
    @Environment(\.scenePhase) private var phase

    var body: some View {
        NavigationStack(path: $path) {
            HomeView(open: { path.append(Route.plate($0.slugValue)) }, about: { path.append(Route.about) })
                .navigationDestination(for: Route.self) { r in
                    switch r {
                    case .plate(let slug):
                        DetailView(slug: slug, open: { path.append(Route.plate($0.slugValue)) })
                    case .about:
                        AboutView()
                    }
                }
        }
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
    var open: (Plate) -> Void
    var about: () -> Void
    @Environment(\.accessibilityVoiceOverEnabled) private var voiceOver

    var body: some View {
        ZStack(alignment: .top) {
            Color.black.ignoresSafeArea()
            CloudView(plates: store.plates, onOpen: open)
                .ignoresSafeArea()
                .accessibilityHidden(true)
            HStack {
                Brand(color: .white)
                Spacer()
                Button("About", action: about).buttonStyle(TextButtonStyle(color: .white))
            }
            .padding(.horizontal, Theme.pad).padding(.top, 8)
            if store.plates.isEmpty {
                VStack { Spacer(); Text(store.status ?? "Loading the archive.").foregroundStyle(.white).font(Theme.meta); Spacer() }
            } else if let s = store.status {
                VStack { Spacer(); Text(s).font(Theme.small).foregroundStyle(.white.opacity(0.7)).padding(.bottom, 12) }
            }
        }
        .toolbar(.hidden, for: .navigationBar)
        .statusBarHidden(false)
        .preferredColorScheme(.dark)
        // VoiceOver users get a plain list over the cloud; the cloud is a visual.
        .overlay { if voiceOver { AccessibleList(open: open) } }
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
