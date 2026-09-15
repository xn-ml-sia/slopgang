type Page = 'home' | 'about'

export function SiteNav({ current }: { current: Page }) {
  return (
    <nav className="nav" aria-label="Primary">
      <a className="nav-mark" href="/" aria-current={current === 'home' ? 'page' : undefined}>
        slopgang
      </a>
      <ul className="nav-links">
        <li>
          <a href="/about" aria-current={current === 'about' ? 'page' : undefined}>
            About
          </a>
        </li>
      </ul>
    </nav>
  )
}
