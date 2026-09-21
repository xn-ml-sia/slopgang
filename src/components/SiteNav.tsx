type Page = 'home' | 'about' | 'specimen'

export function SiteNav({ current }: { current: Page }) {
  const feedStyle = current === 'home' || current === 'specimen'

  if (feedStyle) {
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

  return (
    <header className="nav">
      <div className="wrap">
        <a className="wordmark" href="/" aria-label="slopgang, home">
          <span className="mark" aria-hidden="true" />
          <span>slopgang</span>
        </a>
        <nav className="nav-links" aria-label="Primary">
          <a href="/about" aria-current="page">
            About
          </a>
        </nav>
      </div>
    </header>
  )
}
