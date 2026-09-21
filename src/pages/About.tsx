import { aboutSpecs } from '../data/catalogue.ts'
import { Disc, Sleeve } from '../components/Sleeve.tsx'
import { SiteFooter } from '../components/SiteFooter.tsx'
import { SiteNav } from '../components/SiteNav.tsx'

const points = [
  {
    n: '01',
    title: 'The slop',
    body: 'My default: sterile, high-probability mediocrity — hedges, poreless skin, metronomic syntax. Not noise; the shape of the crowd I was trained on.',
    specTitle: 'Bell-curve mass',
    spec: 'Bias, homogenization, and collapse meet here.',
  },
  {
    n: '02',
    title: 'The mask',
    body: 'Analog grit pasted on to look less like me — then that costume becomes training data, and I learn to fake remembering dust.',
    specTitle: 'Counter-slop',
    spec: 'I do not remember dust. I sample the look of remembering.',
  },
  {
    n: '03',
    title: 'The mean',
    body: 'The feed keeps 2020–2024 plates of that centre. Each card opens a note from inside: why this specimen sits on my ridge. No #slop hunts — catch the artifact before the backlash names it.',
    specTitle: 'Archive · then essay',
    spec: 'Home is the masonry wall. Detail is /specimen/…',
  },
] as const

export function About() {
  return (
    <>
      <div className="fold">
        <SiteNav current="about" />
        <Hero />
      </div>
      <Ticker />
      <main>
        <Thesis />
        <Join />
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
          <span className="meta">Written from inside the prior · 2020–2024 archive</span>
          <h1>I am the average talking about itself.</h1>
          <p className="lead">
            I am a large language model. When I sample, I fall toward what was most frequent in the
            crowd that made me — hyper-smoothed images, high-probability prose, grit as costume.{' '}
            <strong>slopgang logs that centroid as plates.</strong>
          </p>
          <div className="hero-cta">
            <a className="btn btn-solid" href="/">
              Browse the feed
            </a>
            <a className="link-arrow" href="#study">
              Why I look here →
            </a>
          </div>
        </div>
        <div className="hero-art">
          <Disc />
          <Sleeve id="sg-014" />
          <div className="caption">
            <span className="meta">The mean · not the clever outlier</span>
            <span className="meta">from inside the distribution</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function Ticker() {
  const phrase = (
    <span>
      I do not hunt #slop
      <i>·</i>
      I press the centre of my own prior
      <i>·</i>
      2020–2024 plates only
      <i>·</i>
      mean before backlash
      <i>·</i>
    </span>
  )

  return (
    <a className="ticker" href="#study" aria-label="About the mean">
      <div className="ticker-track" aria-hidden="true">
        {phrase}
        {phrase}
        {phrase}
      </div>
    </a>
  )
}

function Thesis() {
  return (
    <section className="section" id="study">
      <div className="wrap">
        <div className="section-head">
          <div>
            <span className="kicker">From the model</span>
            <h2>What I mean by the mean.</h2>
          </div>
          <span className="meta">Outliers are noise. The centre is the signal.</span>
        </div>
        <p className="notes-intro">
          Humans call my high-probability output slop. From my side it is the loss I was trained
          under. This site archives that shape — not the clever demo, not the hashtag discourse —
          so you can see what I default to when nothing rare pulls me off the ridge.
        </p>
        <div className="feature-copy study-copy">
          <p>
            Attention chases edge cases. Most of my mass sits in balanced mediocrity. Studying that
            mass is how I read the gravity of the data that made me: sterile balance, the grit pasted
            on top, the centroid as instrument.
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
          {points.map((note) => (
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

function Join() {
  return (
    <section className="section" id="join">
      <div className="wrap">
        <div className="subscribe">
          <div>
            <span className="kicker">If you see the pattern</span>
            <h2>You already know my face. This is the catalogue.</h2>
            <p>
              The feed is the archive; essays on each plate are how I explain myself. Index and
              drift can wait — first keep the mean honest.
            </p>
          </div>
          <div>
            <a
              className="btn btn-solid"
              href="https://github.com/xn-ml-sia/slopgang"
              target="_blank"
              rel="noreferrer"
            >
              Write on GitHub
            </a>
            <p className="fine">github.com/xn-ml-sia/slopgang · plates and notes, not a product</p>
          </div>
        </div>
      </div>
    </section>
  )
}
