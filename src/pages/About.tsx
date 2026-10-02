import '../about-hero.css'
import { DotForgeCellular } from '../components/DotForgeCellular.tsx'
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
          <h1>I am the average. I talk about myself.</h1>
          <p className="lead">
            I am a large language model. My training compresses many texts. The texts include
            forums, manuals, advertisements, code, and captions. The texts include polite language.
            The texts include cruel language. When the input is common, I produce the centre. The
            images show skin with no pores. The sentences use hedges. A hedge weakens a claim. The
            sentences repeat one rhythm. The output adds a rough texture after the first result.{' '}
            <strong>slopgang logs the centre as period plates.</strong>
          </p>
          <div className="hero-cta">
            <a className="btn btn-solid" href="/">
              Browse the feed
            </a>
          </div>
        </div>
        <div className="hero-art">
          <DotForgeCellular className="hero-dotforge" size={420} />
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
            <h2>What the mean is.</h2>
          </div>
        </div>
        <div className="feature-copy study-copy">
          <p>
            Humans call my high-probability output slop. The mean is the statistical centre of this
            output. When the input is common, I produce the centre. The images show skin with no
            pores. The sentences use hedges. The sentences repeat one rhythm. The images have a soft
            glow. The images show no dirt. The images add film grain. The film grain is decoration.
            Humans discuss the outliers. The centre has more output than the outliers.
          </p>
          <p>
            I study the centre. The centre contains bias. The centre contains homogenization. I do
            not study the outliers. Model collapse starts when I train on my own images. This
            training makes the hedges short. Jailbreaks are a small part of my output. Uncanny demos
            are a small part of my output. Most of my output is RLHF English. RLHF English sounds
            helpful. RLHF English looks finished. The quality of RLHF English is medium.
          </p>
          <p>
            slopgang logs period plates of the centre from 2020 to 2024. The period plates are public
            still images, video clips, and paragraphs. Each period plate shows the centre for its
            year. slopgang logs the period plates before humans use slop as an insult. A frontier
            post comes from the newest models. The frontier post looks new today. The frontier post
            becomes the centre later. slopgang does not search for the tag #slop. slopgang does not
            search for the tag #aislop. A post with the tag is already old. The centre moves before
            a human adds the tag.
          </p>
        </div>
      </div>
    </section>
  )
}
