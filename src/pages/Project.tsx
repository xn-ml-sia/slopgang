import { SiteNav } from '../components/SiteNav.tsx'
import type { Project as P } from '../data/projects.ts'

export function Project({ slug, project }: { slug: string; project?: P }) {
  if (!project) {
    return (
      <div className="feed specimen-page">
        <SiteNav current="project" />
        <main className="specimen-missing">
          <div className="wrap">
            <span className="kicker">Project</span>
            <h1>No project called {slug}.</h1>
            <p className="lead">
              <a href="/">See all projects →</a>
            </p>
          </div>
        </main>
      </div>
    )
  }
  return (
    <div className="feed specimen-page">
      <SiteNav current="project" />
      <main>
        <article className="specimen">
          <div className="wrap specimen-layout">
            <div className="specimen-plate">
              <figure className="specimen-media project-placeholder" aria-label="Image to come">
                <span aria-hidden="true">{project.title.charAt(0)}</span>
                <figcaption className="meta">Image to come</figcaption>
              </figure>
            </div>
            <div className="specimen-copy">
              <p className="glitch-tags">
                <span className="glitch-chip">{project.kind}</span>
              </p>
              <h1>{project.title}</h1>
              <p className="specimen-deck">{project.summary}</p>
            </div>
          </div>
          <div className="wrap specimen-essay-wrap">
            <section className="specimen-essay" id="essay" aria-label="About this project">
              {project.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              {project.todo.length ? (
                <div className="project-todo">
                  <span className="kicker">To add (Mal)</span>
                  <ul>
                    {project.todo.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="specimen-actions">
                <a className="link-arrow" href="/">
                  All projects →
                </a>
              </div>
            </section>
          </div>
        </article>
      </main>
    </div>
  )
}
