import { aboutSpecs, manifestoNotes } from '../data/catalogue.ts'
import { Sleeve } from '../components/Sleeve.tsx'

export function About() {
  return (
    <main>
      <section className="page-hero" id="study">
        <div className="wrap">
          <span className="kicker">Manifesto · phase I</span>
          <h1>A manifesto for the average.</h1>
          <p className="lead">
            We do not hunt outliers. We press the centre. Slop — the predictable, high-probability, hyper-smoothed
            output of large-scale models — is not noise; it is a mirror of collective bias.{' '}
            <strong>This site is the first pressing: an archive of specimens, each given a catalogue number and a
            sleeve.</strong>
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="feature">
            <div className="feature-art">
              <Sleeve id="sg-014" />
              <div className="caption">
                <span className="meta">Front sleeve, SG-014</span>
                <span className="meta">the hinge plate</span>
              </div>
            </div>
            <div className="feature-copy">
              <span className="kicker">The study</span>
              <h2>We study the centre to understand the drift.</h2>
              <p>
                Mainstream attention follows emergent intelligence and infinite expansion. slopgang follows the
                statistical centroid: the high-density mass of the bell curve where bias, homogenization, and model
                collapse converge.
              </p>
              <p>
                By studying the textures of the machine’s mean we can detect the gravity of digital culture. The slop
                is the drive toward sterile, perfectly balanced mediocrity. The mask is the analog grit used to hide
                it. The mean is the instrument.
              </p>
              <p>
                Phase I is the Archive. Phase II, the Slop Index, will make the archetypes searchable. Phase III, Drift
                Analysis, will watch the centroid move in something closer to real time. Series one is the pressing
                that makes both possible.
              </p>
              <dl className="specs">
                {aboutSpecs.map((row) => (
                  <div key={row.dt}>
                    <dt>{row.dt}</dt>
                    <dd>{row.dd}</dd>
                  </div>
                ))}
              </dl>
              <div className="feature-cta">
                <a className="btn btn-solid" href="/#catalogue">
                  Browse the catalogue
                </a>
                <a className="link-arrow" href="/#method">
                  Read the method notes →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="kicker">Pressing notes</span>
              <h2>Five arguments, one centroid.</h2>
            </div>
            <span className="meta">From the manifesto · reset as a ladder</span>
          </div>
          <p className="notes-intro">
            The most profound truths are not found in the outliers, but in the centre of the sludge.
          </p>
          <div className="ladder">
            {manifestoNotes.map((note) => (
              <div className="step" key={note.n}>
                <span className="n">{note.n}</span>
                <div>
                  <h3>{note.title}</h3>
                  <p>{note.body}</p>
                </div>
                <div className="spec">
                  <b>{note.specTitle}</b>
                  {note.spec}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
