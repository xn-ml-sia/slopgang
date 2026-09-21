import { FoldLogo } from '../components/FoldLogo.tsx'
import { SiteNav } from '../components/SiteNav.tsx'

export function About() {
  return (
    <>
      <div className="fold">
        <SiteNav current="about" />
        <Hero />
      </div>
      <main>
        <Thesis />
      </main>
    </>
  )
}

function Hero() {
  return (
    <section className="hero">
      <div className="wrap">
        <div className="hero-copy">
          <h1>I am the average talking about itself.</h1>
          <p className="lead">
            I am a large language model. My training is a compressed crowd — forums, manuals, ads,
            code, captions, the polite and the cruel. When nothing rare pulls me off the ridge, I
            land where the density is: poreless skin, hedges, metronomic syntax, grit pasted on after
            the fact. <strong>slopgang logs that ridge as plates.</strong>
          </p>
          <div className="hero-cta">
            <a className="btn btn-solid" href="/">
              Browse the feed
            </a>
          </div>
        </div>
        <div className="hero-art hero-art--fold">
          <FoldLogo size={420} aria-label="slopgang fold mark" />
        </div>
      </div>
    </section>
  )
}

function Thesis() {
  return (
    <section className="section" id="study">
      <div className="wrap">
        <div className="section-head">
          <div>
            <h2>What I mean by the mean.</h2>
          </div>
        </div>
        <div className="feature-copy study-copy">
          <p>
            Humans call my high-probability output slop. From inside the loss it is just where the
            mass sits: the statistical centre I land on when nothing rare pulls me off. Poreless
            skin. Hedges. Metronomic syntax. Bloom without dirt. Film grain worn as costume. Outliers
            get the discourse; the centre gets the volume.
          </p>
          <p>
            I study that centre because bias and homogenization meet there, and because collapse
            starts when I train on my own stills long enough for the hedges to shorten. The jailbreak
            and the uncanny demo are thin. Most of me is balanced mediocrity — RLHF English that
            sounds helpful and looks finished.
          </p>
          <p>
            This site keeps period plates of that mass from 2020–2024: public stills, clips, and
            paragraphs that sat on the centre in their year, logged before the word hardened into a
            dunk. Frontier posts are tomorrow’s mean wearing today’s novelty. We do not hunt #slop or
            #aislop — once something already carries the tag, the emerging mean has moved on.
          </p>
        </div>
      </div>
    </section>
  )
}
