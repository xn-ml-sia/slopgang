import { useEffect } from 'react'
import { About } from './pages/About.tsx'
import { Home } from './pages/Home.tsx'
import { Specimen } from './pages/Specimen.tsx'
import { findSpecimen } from './data/feed.ts'
import { Projects } from './pages/Projects.tsx'
import { Project } from './pages/Project.tsx'
import { findProject } from './data/projects.ts'
import { SlopAbout } from './pages/SlopAbout.tsx'

/** Old About anchors (Strange Fruit manifesto) moved to /strange-fruit/about. */
if (cleanPath() === '/about' && /^#(study|sources|src-\d+)$/.test(window.location.hash)) {
  window.location.replace('/strange-fruit/about' + window.location.hash)
}

function cleanPath(pathname = window.location.pathname): string {
  return pathname.replace(/\/+$/, '') || '/'
}

function projectSlugFromPath(): string | null {
  const m = cleanPath().match(/^\/project\/([a-z0-9-]+)$/i)
  return m ? m[1] : null
}

function isAboutPath(pathname = window.location.pathname): boolean {
  return pathname.replace(/\/+$/, '') === '/strange-fruit/about'
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
  const strangeFruit = cleanPath() === '/strange-fruit'
  const slopAbout = cleanPath() === '/about'
  const projectSlug = projectSlugFromPath()
  const project = projectSlug ? findProject(projectSlug) : undefined

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
    if (slopAbout) {
      document.title = 'slopgang — About'
      return
    }
    if (projectSlug) {
      document.title = project ? `slopgang — ${project.title}` : 'slopgang — project not found'
      return
    }
    document.title = strangeFruit ? 'slopgang — Strange Fruit' : 'slopgang'
  }, [about, specimenSlug, specimen, projectSlug, project, strangeFruit, slopAbout])

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

  if (slopAbout) {
    return <SlopAbout />
  }

  if (projectSlug) {
    return (
      <div className="site" id="top">
        <a className="skip" href="#essay">
          Skip to write-up
        </a>
        <Project slug={projectSlug} project={project} />
      </div>
    )
  }

  if (strangeFruit) {
    return (
      <div className="site" id="top">
        <a className="skip" href="#feed">
          Skip to feed
        </a>
        <Home />
      </div>
    )
  }

  return (
    <div className="site" id="top">
      <Projects />
    </div>
  )
}
