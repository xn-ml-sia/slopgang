import type { ReactNode } from 'react'
import '../about-hero.css'
import { DotForgeCellular } from '../components/DotForgeCellular.tsx'
import { SiteNav } from '../components/SiteNav.tsx'
import about from '../data/about.json'

/** About text lives in src/data/about.json so the site and the iOS app read the same words.
 *  Inline markup: [n] is a source citation, **text** is bold. */
function Cite({ n }: { n: number }) {
  return (
    <sup className="cite">
      <a href={`#src-${n}`} aria-label={`Source ${n}`}>
        {n}
      </a>
    </sup>
  )
}

function Rich({ text }: { text: string }) {
  const parts = text.split(/(\[\d+\]|\*\*[^*]+\*\*)/g).filter(Boolean)
  return (
    <>
      {parts.map((p, i) => {
        const cite = /^\[(\d+)\]$/.exec(p)
        if (cite) return <Cite key={i} n={Number(cite[1])} />
        const bold = /^\*\*([^*]+)\*\*$/.exec(p)
        if (bold) return <strong key={i}>{bold[1]}</strong>
        return p
      })}
    </>
  )
}

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
          <h1>{about.title}</h1>
          <p className="lead">
            <Rich text={about.lead} />
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

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className="section" id={id}>
      <div className="wrap">
        <div className="section-head">
          <div>
            <h2>{title}</h2>
          </div>
        </div>
        <div className="feature-copy study-copy">{children}</div>
      </div>
    </section>
  )
}

function Thesis() {
  return (
    <>
      {about.sections.map((s) => (
        <Section key={s.id} id={s.id} title={s.title}>
          {s.paragraphs.map((p, i) => (
            <p key={i}>
              <Rich text={p} />
            </p>
          ))}
        </Section>
      ))}
      <section className="section" id="sources">
        <div className="wrap">
          <div className="section-head">
            <div>
              <h2>Sources</h2>
            </div>
          </div>
          <ol className="about-sources">
            {about.sources.map((s) => (
              <li key={s.id} id={`src-${s.id}`}>
                {s.text}{' '}
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.url}
                </a>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  )
}
