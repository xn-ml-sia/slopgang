import { useEffect } from 'react'
import { About } from './pages/About.tsx'
import { Home } from './pages/Home.tsx'
import { Specimen } from './pages/Specimen.tsx'
import { findSpecimen } from './data/feed.ts'

function isAboutPath(pathname = window.location.pathname): boolean {
  return pathname.replace(/\/+$/, '') === '/about'
}

function specimenSlugFromPath(pathname = window.location.pathname): string | null {
  const cleaned = pathname.replace(/\/+$/, '')
  const match = cleaned.match(/^\/specimen\/([a-z0-9-]+)$/i)
  return match ? match[1] : null
}

export default function App() {
  const about = isAboutPath()
  const specimenSlug = specimenSlugFromPath()
  const specimen = specimenSlug ? findSpecimen(specimenSlug) : undefined

  useEffect(() => {
    if (about) {
      document.title = 'slopgang — manifesto'
      return
    }
    if (specimenSlug) {
      document.title = specimen
        ? `slopgang — ${specimen.title.replace(/^Specimen\s+\d+\s+[—–-]\s*/i, '').trim()}`
        : 'slopgang — specimen not found'
      return
    }
    document.title = 'slopgang'
  }, [about, specimenSlug, specimen])

  if (about) {
    return (
      <div className="site" id="top">
        <a className="skip" href="#study">
          Skip to manifesto
        </a>
        <About />
      </div>
    )
  }

  if (specimenSlug) {
    return (
      <div className="site" id="top">
        <a className="skip" href="#essay">
          Skip to essay
        </a>
        <Specimen slug={specimenSlug} record={specimen} />
      </div>
    )
  }

  return (
    <div className="site" id="top">
      <a className="skip" href="#feed">
        Skip to feed
      </a>
      <Home />
    </div>
  )
}
