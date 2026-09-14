import { Feed } from './components/Feed.tsx'
import { Manifesto } from './components/Manifesto.tsx'
import { SiteFooter } from './components/SiteFooter.tsx'
import { SiteHeader } from './components/SiteHeader.tsx'

export default function App() {
  return (
    <div className="site" id="top">
      <a className="skip" href="#archive">
        Skip to archive
      </a>
      <SiteHeader />
      <Feed />
      <Manifesto />
      <SiteFooter />
    </div>
  )
}
