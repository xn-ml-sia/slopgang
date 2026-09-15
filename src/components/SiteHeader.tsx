import { CentroidDiagram } from './CentroidDiagram.tsx'
import { SiteNav } from './SiteNav.tsx'

function dateline(d = new Date()): string {
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function SiteHeader() {
  return (
    <header className="site-head">
      <SiteNav current="home" />

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="overline">The study · {dateline()}</p>
          <h1 id="hero-title" className="wordmark">
            slopgang
          </h1>
          <p className="wordmark-aside">Mapping the aesthetic of the average.</p>
          <p className="lede">
            A forensic reading of the statistical centroid: hyper-smoothed images, high-probability prose, and the analog
            masks used to hide them. We do not hunt outliers. We log the mean.
          </p>
          <a className="btn-ink" href="/about">
            Read the manifesto
          </a>
        </div>
        <div className="hero-panel">
          <CentroidDiagram />
          <p className="hero-key">
            <span>
              <i className="key-dot key-dot-ivory" /> ivory · mass of the average
            </span>
            <span>
              <i className="key-dot key-dot-brass" /> brass · the point we log
            </span>
          </p>
        </div>
      </section>
    </header>
  )
}
