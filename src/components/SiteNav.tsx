type Page = 'home' | 'about' | 'specimen'

/** Logo + About only — same chrome on every page. */
export function SiteNav({ current }: { current: Page }) {
  return (
    <header className="feed-nav">
      <a className="feed-wordmark" href="/" aria-current={current === 'home' ? 'page' : undefined}>
        slopgang
      </a>
      <nav aria-label="Primary">
        <a href="/about" aria-current={current === 'about' ? 'page' : undefined}>
          About
        </a>
      </nav>
    </header>
  )
}
