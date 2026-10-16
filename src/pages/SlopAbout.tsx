import { JOIN_HREF, KitFooter, KitHeader } from '../components/Kit.tsx'
import { PROJECTS } from '../data/projects.ts'
import { HOME_LEAD } from './Projects.tsx'

const TODO = 'To add (Mal)'

/** slopgang About. Layout follows Mal's about reference (Oct 2026). */
export function SlopAbout() {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    <div className="kit-root">
      <KitHeader current="about" />
      <main className="kit-main">
        <section className="kit-sec kit-sec--surface kit-sec--first" aria-labelledby="about-title">
          <div className="kit-wrap kit-about-intro">
            <figure className="kit-portrait">
              <div className="kit-portrait-img" role="img" aria-label="Image to come">
                <span className="t-caption ink-2">Image to come</span>
              </div>
              <figcaption className="t-caption ink-2">
                <span>slopgang</span>
                <span>{TODO}</span>
              </figcaption>
            </figure>
            <div className="kit-about-copy">
              <h1 id="about-title" className="kit-display kit-about-h1">We build apps for people we know.</h1>
              <div className="kit-about-text">
                <p className="t-body ink-2">slopgang is an AI GmbH. We build apps for friends and family.</p>
                <p className="t-body ink-2">
                  Anyone can join. Bring your time and your skills, and pick a project.
                </p>
              </div>
              <dl className="kit-facts">
                <div><dt className="t-caption ink-2">Company</dt><dd className="t-body">AI GmbH</dd></div>
                <div><dt className="t-caption ink-2">Projects</dt><dd className="t-body">{PROJECTS.length}</dd></div>
                <div><dt className="t-caption ink-2">Based in</dt><dd className="t-body ink-3">{TODO}</dd></div>
                <div><dt className="t-caption ink-2">Since</dt><dd className="t-body ink-3">{TODO}</dd></div>
              </dl>
              <a className="t-label kit-arrowlink" href="/"><span className="kit-draw">See the projects</span> →</a>
            </div>
          </div>
        </section>

        <section className="kit-sec kit-sec--canvas" aria-labelledby="projects-title">
          <div className="kit-wrap kit-sec-in">
            <div className="kit-sechead">
              <h2 id="projects-title" className="kit-h2">{PROJECTS.length} projects</h2>
              <p className="t-body ink-2">What we build now.</p>
            </div>
            <ol className="kit-rows">
              {PROJECTS.map((p, i) => (
                <li key={p.slug}>
                  <a href={p.href} className="kit-row">
                    <span className="t-caption ink-2">{pad(i + 1)}</span>
                    <span className="kit-row-title"><span className="kit-draw">{p.title}</span></span>
                    <span className="t-body ink-2">{p.summary}</span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="kit-sec kit-sec--surface" aria-labelledby="history-title">
          <div className="kit-wrap kit-sec-in kit-two">
            <div className="kit-two-col">
              <h2 id="history-title" className="kit-h2">How it started</h2>
              <ul className="kit-history">
                <li>
                  <span className="t-caption ink-2">{TODO}</span>
                  <span className="t-label ink-3">History</span>
                  <span className="t-body ink-3">{TODO}</span>
                </li>
              </ul>
            </div>
            <div className="kit-two-col">
              <p className="t-caption ink-2">Team</p>
              <ul className="kit-cells">
                <li className="t-body ink-3">{TODO}</li>
                <li className="t-body ink-3">{TODO}</li>
                <li className="t-body ink-3">{TODO}</li>
                <li className="t-body ink-3">{TODO}</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="kit-sec kit-sec--surface" aria-labelledby="join-title">
          <div className="kit-wrap kit-cta-sec">
            <h2 id="join-title" className="kit-display kit-cta-h">Do you want to help?</h2>
            <p className="t-lead ink-2 kit-lead-40">Pick a project. Tell us what you can do.</p>
            <div className="kit-cta-row">
              <a className="kit-btn kit-btn--lg t-label" href={JOIN_HREF}>Join →</a>
              <span className="t-label ink-3">Contact: {TODO}</span>
            </div>
            <p className="t-caption ink-2">
              The Strange Fruit manifesto is now at <a className="kit-u" href="/strange-fruit/about">/strange-fruit/about</a>.
            </p>
          </div>
        </section>
      </main>
      <KitFooter lead={HOME_LEAD} />
    </div>
  )
}
