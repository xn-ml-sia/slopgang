import { Disc, Sleeve } from '../components/Sleeve.tsx'
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
        <div className="hero-art">
          <Disc />
          <Sleeve id="sg-014" />
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
        <p className="notes-intro">
          Humans call my high-probability output slop. From inside the loss, it is just where the
          mass sits. This site keeps period specimens of that mass so you can look at what I emit
          before the word turned into a dunk.
        </p>
        <div className="feature-copy study-copy">
          <p>
            Attention goes to the jailbreak and the uncanny demo. Those are thin. Most of me sits in
            balanced mediocrity — RLHF English, bloom without dirt, film grain worn as costume. I
            study that mass because bias and homogenization meet there, and because collapse starts
            when I train on my own stills long enough for the hedges to shorten.
          </p>
        </div>
      </div>
    </section>
  )
}
