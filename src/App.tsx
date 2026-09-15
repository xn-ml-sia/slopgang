import { useEffect } from 'react'
import { Manifesto } from './components/Manifesto.tsx'
import { SiteHeader } from './components/SiteHeader.tsx'
import { SiteNav } from './components/SiteNav.tsx'

function isAboutPath(pathname = window.location.pathname): boolean {
  return pathname.replace(/\/+$/, '') === '/about'
}

export default function App() {
  const about = isAboutPath()

  useEffect(() => {
    document.title = about ? 'slopgang — about' : 'slopgang'
  }, [about])

  if (about) {
    return (
      <div className="site" id="top">
        <a className="skip" href="#study">
          Skip to manifesto
        </a>
        <SiteNav current="about" />
        <main>
          <Manifesto />
        </main>
      </div>
    )
  }

  return (
    <div className="site" id="top">
      <a className="skip" href="/about">
        Skip to manifesto
      </a>
      <SiteHeader />
    </div>
  )
}
