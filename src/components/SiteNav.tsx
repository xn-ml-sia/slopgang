type Page = 'home' | 'about'

const HOME_LINKS = [
  { href: '#catalogue', label: 'Catalogue' },
  { href: '#method', label: 'Method' },
  { href: '#featured', label: 'SG-014' },
  { href: '#index', label: 'Index' },
] as const

export function SiteNav({ current }: { current: Page }) {
  const prefix = current === 'about' ? '/' : ''

  return (
    <header className="nav">
      <div className="wrap">
        <a className="wordmark" href="/" aria-label="slopgang, home" aria-current={current === 'home' ? 'page' : undefined}>
          <span className="mark" aria-hidden="true" />
          <span>slopgang</span>
          <small>phase I · archive</small>
        </a>
        <nav className="nav-links" aria-label="Primary">
          {HOME_LINKS.map((link) => (
            <a key={link.href} href={`${prefix}${link.href}`}>
              {link.label}
            </a>
          ))}
          <a href="/about" aria-current={current === 'about' ? 'page' : undefined}>
            About
          </a>
        </nav>
        <div className="nav-util">
          <a className="btn btn-sm" href="https://github.com/xn-ml-sia/slopgang" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </div>
      </div>
    </header>
  )
}
