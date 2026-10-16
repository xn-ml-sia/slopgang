import { lazy, Suspense, useEffect } from 'react'
import { findSpecimen } from './data/feed.ts'
import { findProject } from './data/projects.ts'

const TplHome = lazy(() => import('./pages/TplHome.tsx'))
const TplAbout = lazy(() => import('./pages/TplAbout.tsx'))
const TplCaseIos = lazy(() => import('./pages/TplCaseIos.tsx'))
const TplCaseWeb = lazy(() => import('./pages/TplCaseWeb.tsx'))
const SFHome = lazy(() => import('./pages/Legacy.tsx').then((m) => ({ default: m.Home })))
const SFAbout = lazy(() => import('./pages/Legacy.tsx').then((m) => ({ default: m.About })))
const SFSpecimen = lazy(() => import('./pages/Legacy.tsx').then((m) => ({ default: m.Specimen })))

function cleanPath(pathname = window.location.pathname): string {
  return pathname.replace(/\/+$/, '') || '/'
}

// Old About anchors (Strange Fruit manifesto) moved to /strange-fruit/about.
if (cleanPath() === '/about' && /^#(study|sources|src-\d+)$/.test(window.location.hash)) {
  window.location.replace('/strange-fruit/about' + window.location.hash)
}

function Route() {
  const path = cleanPath()
  const specimenSlug = path.match(/^\/specimen\/([a-z0-9-]+)$/i)?.[1] ?? null
  const projectSlug = path.match(/^\/project\/([a-z0-9-]+)$/i)?.[1] ?? null
  const specimen = specimenSlug ? findSpecimen(specimenSlug) : undefined

  useEffect(() => {
    if (path === '/strange-fruit/about') document.title = 'slopgang — manifesto'
    else if (path === '/strange-fruit') document.title = 'slopgang — Strange Fruit'
    else if (specimenSlug)
      document.title = specimen
        ? `slopgang — ${specimen.title.replace(/^Specimen\s+\d+\s+[—–-]\s*/i, '').trim()}`
        : 'slopgang — specimen not found'
  }, [path, specimenSlug, specimen])

  if (path === '/strange-fruit/about')
    return (
      <div className="site" id="top">
        <a className="skip" href="#study">Skip to manifesto</a>
        <SFAbout />
      </div>
    )
  if (path === '/strange-fruit')
    return (
      <div className="site" id="top">
        <a className="skip" href="#feed">Skip to feed</a>
        <SFHome />
      </div>
    )
  if (specimenSlug)
    return (
      <div className="site" id="top">
        <a className="skip" href="#essay">Skip to essay</a>
        <SFSpecimen slug={specimenSlug} record={specimen} />
      </div>
    )
  if (path === '/about') return <TplAbout />
  if (projectSlug) {
    const p = findProject(projectSlug)
    if (p?.template === 'ios') return <TplCaseIos slug={p.slug as 'ikebana' | 'pet-cemetery'} />
    if (p?.template === 'web') return <TplCaseWeb />
  }
  return <TplHome />
}

export default function App() {
  return (
    <Suspense fallback={null}>
      <Route />
    </Suspense>
  )
}
