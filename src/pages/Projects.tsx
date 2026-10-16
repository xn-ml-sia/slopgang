import { KitFooter, KitHeader } from '../components/Kit.tsx'
import { PROJECTS } from '../data/projects.ts'

export const HOME_LEAD =
  'slopgang is an AI GmbH. We build apps for friends and family. Do you like a project? Join us and help with your time and skills.'

export function Projects() {
  return (
    <div className="kit-root">
      <KitHeader current="projects" />
      <main id="projects" className="kit-main">
        <section className="kit-hero" aria-labelledby="top-title">
          <div className="kit-wrap kit-hero-in">
            <h1 id="top-title" className="kit-display">slopgang</h1>
            <p className="t-lead ink-2 kit-lead">{HOME_LEAD}</p>
          </div>
        </section>
        <section className="kit-grid-sec" aria-label="Projects">
          <ul className="kit-wrap kit-grid">
            {PROJECTS.map((p) => (
              <li key={p.slug}>
                <a className="kit-card" href={p.href}>
                  <div className="kit-thumb">
                    {p.thumb ? (
                      <img src={p.thumb} alt="" decoding="async" />
                    ) : (
                      <span className="kit-thumb-ph" aria-hidden="true">{p.title.charAt(0)}</span>
                    )}
                  </div>
                  <span className="kit-card-row">
                    <span className="t-heading kit-draw">{p.title}</span>
                    <span className="t-caption ink-2">{p.kind}</span>
                  </span>
                  <span className="t-body ink-2">{p.summary}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <KitFooter lead={HOME_LEAD} />
    </div>
  )
}
