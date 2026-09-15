type Page = 'home' | 'about'

export function SiteNav({ current }: { current: Page }) {
  if (current === 'home') {
    return (
      <header className="feed-nav">
        <a className="feed-wordmark" href="/" aria-current="page">
          slopgang
        </a>
        <nav aria-label="Primary">
          <a href="/about">About</a>
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
          <small>phase I · archive</small>
        </a>
        <nav className="nav-links" aria-label="Primary">
          <a href="/">Feed</a>
          <a href="#method">Method</a>
          <a href="#featured">SG-014</a>
          <a href="/about" aria-current="page">
            About
          </a>
        </nav>
      </div>
    </header>
  )
}
