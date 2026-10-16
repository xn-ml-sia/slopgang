import { KitFooter, KitHeader } from '../components/Kit.tsx'
import { PROJECTS, type Project as P } from '../data/projects.ts'
import { HOME_LEAD } from './Projects.tsx'

const TODO = 'To add'

/** Case-study page. Layout follows Mal's references: 'ios' (app) and 'web' (tool). */
export function Project({ slug, project }: { slug: string; project?: P }) {
  if (!project) {
    return (
      <div className="kit-root">
        <KitHeader current="project" />
        <main className="kit-main">
          <section className="kit-hero">
            <div className="kit-wrap kit-hero-in">
              <h1 className="kit-display">No project called {slug}.</h1>
              <p className="t-lead ink-2"><a href="/">See all projects</a></p>
            </div>
          </section>
        </main>
        <KitFooter lead={HOME_LEAD} />
      </div>
    )
  }

  const list = PROJECTS.filter((p) => p.layout)
  const idx = list.findIndex((p) => p.slug === project.slug)
  const next = list[(idx + 1) % list.length]
  const pad = (n: number) => String(n).padStart(2, '0')
  const ios = project.layout === 'ios'
  const platform = ios ? 'iOS' : TODO

  return (
    <div className="kit-root">
      <KitHeader current="project" />
      <main className="kit-main">
        <section className="kit-cover" aria-labelledby="case-title">
          <div className="kit-cover-art" role="img" aria-label="Cover image to come">
            <span className="t-caption ink-2">Cover image to come</span>
          </div>
          <div className="kit-wrap kit-cover-in">
            <div className="kit-cover-top">
              <a className="t-caption ink-2 kit-backlink" href="/">← <span className="kit-draw">All projects</span></a>
              <span className="t-caption ink-2">{pad(idx + 1)} / {pad(list.length)}</span>
            </div>
            <div className="kit-cover-title">
              <h1 id="case-title" className="kit-display">{project.title}</h1>
              <p className="t-lead kit-lead-40">{project.summary}</p>
            </div>
            <dl className="kit-meta">
              <div><dt className="t-caption ink-2">Type</dt><dd className="t-label">{project.kind}</dd></div>
              <div><dt className="t-caption ink-2">Platform</dt><dd className="t-label">{platform}</dd></div>
              <div><dt className="t-caption ink-2">Status</dt><dd className="t-label ink-3">{TODO}</dd></div>
              <div><dt className="t-caption ink-2">Year</dt><dd className="t-label ink-3">{TODO}</dd></div>
            </dl>
          </div>
        </section>

        <section className="kit-sec kit-sec--surface" aria-labelledby="overview-title">
          <div className="kit-wrap kit-sec-in">
            <div className="kit-overview">
              <div className="kit-overview-main">
                <h2 id="overview-title" className="t-caption ink-2">01 · Overview</h2>
                <p className="kit-bigtext">{project.body.join(' ')}</p>
              </div>
              <dl className="kit-specs">
                <div><dt className="t-caption ink-2">Type</dt><dd className="t-body">{project.kind}</dd></div>
                <div><dt className="t-caption ink-2">Platform</dt><dd className="t-body">{platform}</dd></div>
                <div><dt className="t-caption ink-2">Team</dt><dd className="t-body ink-3">{TODO}</dd></div>
                <div><dt className="t-caption ink-2">Status</dt><dd className="t-body ink-3">{TODO}</dd></div>
              </dl>
            </div>
          </div>
        </section>

        <section className="kit-sec kit-sec--canvas" aria-labelledby="s2-title">
          <div className="kit-wrap kit-sec-in">
            <div className="kit-numhead">
              <span className="t-caption ink-2">02</span>
              <div>
                <h2 id="s2-title" className="kit-h2">{ios ? 'The app' : 'The tool'}</h2>
                <p className="t-body ink-2">{ios ? 'Screens to come.' : 'Views to come.'}</p>
              </div>
            </div>
            {ios ? (
              <div className="kit-split">
                <div className="kit-phone" role="img" aria-label="Phone screen placeholder">
                  <span className="kit-phone-notch" />
                  <span className="t-caption kit-phone-note">Screen to come</span>
                </div>
                <div className="kit-todo">
                  <p className="t-caption ink-2">To add (Mal)</p>
                  <ul>{project.todo.map((t) => <li key={t} className="t-body ink-2">{t}</li>)}</ul>
                </div>
              </div>
            ) : (
              <>
                <div className="kit-window" role="img" aria-label="Tool view placeholder">
                  <div className="kit-window-bar"><span /><span /><span /><em className="t-caption">glitch the system</em></div>
                  <div className="kit-window-body"><span className="t-caption ink-2">View to come</span></div>
                </div>
                <ol className="kit-steps">
                  {[1, 2, 3].map((n) => (
                    <li key={n}>
                      <span className="t-caption ink-2">{pad(n)}</span>
                      <h3 className="t-heading">Step {n}</h3>
                      <p className="t-body ink-3">{TODO}</p>
                    </li>
                  ))}
                </ol>
                <div className="kit-todo">
                  <p className="t-caption ink-2">To add (Mal)</p>
                  <ul>{project.todo.map((t) => <li key={t} className="t-body ink-2">{t}</li>)}</ul>
                </div>
              </>
            )}
          </div>
        </section>

        {next && next.slug !== project.slug ? (
          <section className="kit-sec kit-sec--surface kit-next" aria-label="Next project">
            <div className="kit-wrap kit-next-in">
              <div className="kit-cover-top">
                <span className="t-caption ink-2">Next project</span>
                <span className="t-caption ink-2">{pad(list.indexOf(next) + 1)} / {pad(list.length)}</span>
              </div>
              <a className="kit-next-link" href={next.href}>
                <span className="kit-display">{next.title}</span>
                <span className="t-lead ink-2">{next.summary}</span>
                <span className="t-label"><span className="kit-draw">Open the project</span> →</span>
              </a>
            </div>
          </section>
        ) : null}
      </main>
      <KitFooter lead={HOME_LEAD} />
    </div>
  )
}
