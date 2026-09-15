import { useEffect } from 'react'
import { SiteFooter } from './components/SiteFooter.tsx'
import { SiteNav } from './components/SiteNav.tsx'
import { About } from './pages/About.tsx'
import { Home } from './pages/Home.tsx'

function isAboutPath(pathname = window.location.pathname): boolean {
  return pathname.replace(/\/+$/, '') === '/about'
}

export default function App() {
  const about = isAboutPath()

  useEffect(() => {
    document.title = about ? 'slopgang — manifesto' : 'slopgang — specimens of the mean'
  }, [about])

  if (about) {
    return (
      <div className="site" id="top">
        <a className="skip" href="#study">
          Skip to manifesto
        </a>
        <SiteNav current="about" />
        <About />
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="site" id="top">
      <a className="skip" href="#catalogue">
        Skip to catalogue
      </a>
      <Home />
      <SiteFooter />
    </div>
  )
}
