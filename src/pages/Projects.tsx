import { SiteNav } from '../components/SiteNav.tsx'
import { PROJECTS } from '../data/projects.ts'

export function Projects() {
  return (
    <div className="feed projects-page">
      <SiteNav current="home" />
      <main id="projects">
        <div className="wrap">
          <h1 className="projects-title">Projects</h1>
          <ul className="project-grid">
            {PROJECTS.map((p) => (
              <li key={p.slug}>
                <a className="project-card" href={p.href}>
                  <div className={p.thumb ? 'project-thumb' : 'project-thumb project-thumb--blank'}>
                    {p.thumb ? (
                      <img src={p.thumb} alt="" decoding="async" />
                    ) : (
                      <span aria-hidden="true">{p.title.charAt(0)}</span>
                    )}
                  </div>
                  <span className="kicker">{p.kind}</span>
                  <h2>{p.title}</h2>
                  <p>{p.summary}</p>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  )
}
