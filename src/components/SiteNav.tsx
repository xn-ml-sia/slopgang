type Page = 'home' | 'about'

export function SiteNav({ current }: { current: Page }) {
  return (
    <header className="nav">
      <div className="wrap">
        <a
          className="wordmark"
          href="/"
          aria-label="slopgang, home"
          aria-current={current === 'home' ? 'page' : undefined}
        >
          <span className="mark" aria-hidden="true" />
          <span>slopgang</span>
          <small>phase I · archive</small>
        </a>
        <nav className="nav-links" aria-label="Primary">
          {current === 'about' ? (
            <>
              <a href="/">Catalogue</a>
              <a href="#method">Method</a>
              <a href="#featured">SG-014</a>
              <a href="/about" aria-current="page">
                About
              </a>
            </>
          ) : (
            <a href="/about">About</a>
          )}
        </nav>
      </div>
    </header>
  )
}
