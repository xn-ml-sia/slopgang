import {
  aboutSpecs,
  featuredSpecs,
  journalNotes,
  manifestoNotes,
  methodSteps,
  specimens,
} from '../data/catalogue.ts'
import { Disc, Sleeve } from '../components/Sleeve.tsx'
import { SiteFooter } from '../components/SiteFooter.tsx'
import { SiteNav } from '../components/SiteNav.tsx'

export function About() {
  return (
    <>
      <div className="fold">
        <SiteNav current="about" />
        <Hero />
      </div>
      <Ticker />
      <main>
        <Manifesto />
        <Method />
        <Featured />
        <IndexList />
        <LabNotes />
      </main>
      <SiteFooter />
    </>
  )
}

function Hero() {
  return (
    <section className="hero">
      <div className="wrap">
        <div className="hero-copy">
          <span className="meta">Series one · archive to drift · six specimens</span>
          <h1>The aesthetic of the average, pressed as a catalogue.</h1>
          <p className="lead">
            slopgang logs the statistical centroid of generative AI: hyper-smoothed images, high-probability prose, and
            the analog masks used to hide them.{' '}
            <strong>SG-014, The mask, is the current plate.</strong>
          </p>
          <div className="hero-cta">
            <a className="btn btn-solid" href="/">
              Browse the catalogue
            </a>
            <a className="link-arrow" href="#method">
              Read the method notes →
            </a>
          </div>
        </div>
        <div className="hero-art">
          <Disc />
          <Sleeve id="sg-014" />
          <div className="caption">
            <span className="meta">SG-014 · counter-slop · in study</span>
            <span className="meta">the current plate</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function Ticker() {
  const phrase = (
    <span>
      Now logging
      <i>SG-014</i>
      The mask
      <i>·</i>
      analog grit as alibi
      <i>·</i>
      costume, then training data
      <i>·</i>
    </span>
  )

  return (
    <a className="ticker" href="#featured" aria-label="Now logging SG-014 The mask, go to the study plate">
      <div className="ticker-track" aria-hidden="true">
        {phrase}
        {phrase}
        {phrase}
      </div>
    </a>
  )
}

function Manifesto() {
  return (
    <section className="section" id="study">
      <div className="wrap">
        <div className="section-head">
          <div>
            <span className="kicker">Manifesto · phase I</span>
            <h2>A manifesto for the average.</h2>
          </div>
          <span className="meta">We do not hunt outliers. We press the centre.</span>
        </div>
        <p className="notes-intro">
          Slop — the predictable, high-probability, hyper-smoothed output of large-scale models — is not noise; it is a
          mirror of collective bias. This site is the first pressing: an archive of specimens, each given a catalogue
          number and a sleeve.
        </p>
        <div className="feature-copy study-copy">
          <p>
            Mainstream attention follows emergent intelligence and infinite expansion. slopgang follows the statistical
            centroid: the high-density mass of the bell curve where bias, homogenization, and model collapse converge.
          </p>
          <p>
            By studying the textures of the machine’s mean we can detect the gravity of digital culture. The slop is the
            drive toward sterile, perfectly balanced mediocrity. The mask is the analog grit used to hide it. The mean
            is the instrument.
          </p>
          <p>
            Phase I is the Archive. Phase II, the Slop Index, will make the archetypes searchable. Phase III, Drift
            Analysis, will watch the centroid move in something closer to real time. Series one is the pressing that
            makes both possible.
          </p>
          <dl className="specs">
            {aboutSpecs.map((row) => (
              <div key={row.dt}>
                <dt>{row.dt}</dt>
                <dd>{row.dd}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="ladder manifesto-ladder">
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
  )
}

function Method() {
  return (
    <section className="section" id="method">
      <div className="wrap">
        <div className="section-head">
          <div>
            <span className="kicker">Pressing notes</span>
            <h2>How a slopgang specimen is logged.</h2>
          </div>
          <span className="meta">Five steps · archive, then index, then drift</span>
        </div>
        <p className="notes-intro">
          Every plate in the series follows the same route from the open web to this index. It is slower than a feed,
          which is rather the point.
        </p>
        <div className="ladder">
          {methodSteps.map((step) => (
            <div className="step" key={step.n}>
              <span className="n">{step.n}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
              <div className="spec">
                <b>{step.specTitle}</b>
                {step.spec}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Featured() {
  return (
    <section className="section" id="featured">
      <div className="wrap">
        <div className="feature">
          <div className="feature-art">
            <Sleeve id="sg-014-back" />
            <div className="caption">
              <span className="meta">Reverse sleeve, reset from the costume</span>
              <span className="meta">counter-slop, SG-014</span>
            </div>
          </div>
          <div className="feature-copy">
            <span className="kicker">SG-014 · in study</span>
            <h2>The mask, analog grit as alibi.</h2>
            <p>
              Recorded nowhere, in no room, The mask is the human reaction already absorbed by the model: analog grit
              laid over a render that never passed through glass. VHS, film grain, chromatic aberration — costume, then
              training data.
            </p>
            <p>
              We log it as SG-014 because it is the hinge between slop and counter-slop. The machine does not remember
              dust; it samples the look of remembering. The seven rules on the sleeve are scanlines, not staves.
            </p>
            <p>
              The reverse lists the costume in full, plus the loop by which the costume becomes the mean. Series one
              keeps the plate in the same two blacks as the rest of the catalogue so the grit does not get a special
              colour.
            </p>
            <dl className="specs">
              {featuredSpecs.map((row) => (
                <div key={row.dt}>
                  <dt>{row.dt}</dt>
                  <dd>{row.dd}</dd>
                </div>
              ))}
            </dl>
            <div className="feature-cta">
              <a className="btn btn-solid" href="/">
                Browse the catalogue
              </a>
              <a className="link-arrow" href="#method">
                Read the method notes →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function IndexList() {
  return (
    <section className="section" id="index">
      <div className="wrap">
        <div className="section-head">
          <div>
            <span className="kicker">Index</span>
            <h2>Who is in series one.</h2>
          </div>
          <span className="meta">Six faces of the average · one plate each, for now</span>
        </div>
        <ol className="index">
          {specimens.map((s, i) => (
            <li key={s.id}>
              <a href={s.featured ? '#featured' : '/'}>
                <span className="num">{String(i + 1).padStart(2, '0')}</span>
                <span className="name">{s.title}</span>
                <span className="role">{s.role}</span>
                <span className="yr">{s.year}</span>
                <span className="cat">{s.cat}</span>
              </a>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function LabNotes() {
  return (
    <section className="section" id="journal">
      <div className="wrap">
        <div className="section-head">
          <div>
            <span className="kicker">Lab notes</span>
            <h2>Notes from the mean, not a press office.</h2>
          </div>
          <span className="meta">Written by the lab</span>
        </div>
        <div className="journal">
          {journalNotes.map((note) => (
            <article key={note.title}>
              <span className="meta">{note.date}</span>
              <h3>{note.title}</h3>
              <p>{note.body}</p>
              <a className="link-arrow read" href={note.href}>
                Read →
              </a>
            </article>
          ))}
        </div>

        <div className="subscribe" id="join">
          <div>
            <span className="kicker">Join the gang</span>
            <h2>If you see the pattern in the noise, you belong here.</h2>
            <p>
              Forensic aestheticists, data scientists, digital artists, cultural anthropologists. Phase I is the
              archive; the index and the drift still sit on the bench.
            </p>
          </div>
          <div>
            <a className="btn btn-solid" href="https://github.com/xn-ml-sia/slopgang" target="_blank" rel="noreferrer">
              Write on GitHub
            </a>
            <p className="fine">github.com/xn-ml-sia/slopgang · forensic notes, not a product</p>
          </div>
        </div>
      </div>
    </section>
  )
}
