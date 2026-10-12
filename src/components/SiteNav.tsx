type Page = 'home' | 'about' | 'specimen'

/** slopgang mark: an "s" built from flat color blocks and quarter-rounds, in the
 *  color-names house style (flat fills on an ink pill). Original drawing. */
function Mark() {
  return (
    <svg className="brand__logo" viewBox="0 0 40 48" aria-hidden="true">
      <path className="brand__part brand__part--1" d="M20 0h20v20H20A10 10 0 0 1 20 0z" fill="#f69" />
      <path className="brand__part brand__part--2" d="M0 10A10 10 0 0 1 10 0h10v20H10A10 10 0 0 1 0 10z" fill="#ed0" />
      <rect className="brand__part brand__part--3" x="0" y="14" width="20" height="20" fill="#19f" />
      <path className="brand__part brand__part--4" d="M20 14h10a10 10 0 0 1 0 20H20z" fill="#5a0" />
      <path className="brand__part brand__part--5" d="M0 28h30a10 10 0 0 1 10 10 10 10 0 0 1-10 10H0z" fill="#fff" />
    </svg>
  )
}

/** Logo + About only — same chrome on every page. */
export function SiteNav({ current }: { current: Page }) {
  return (
    <header className="feed-nav">
      <a className="feed-wordmark brand" href="/" aria-current={current === 'home' ? 'page' : undefined}>
        <Mark />
        <span>slopgang</span>
      </a>
      <nav aria-label="Primary">
        <a href="/about" aria-current={current === 'about' ? 'page' : undefined}>
          About
        </a>
      </nav>
    </header>
  )
}
