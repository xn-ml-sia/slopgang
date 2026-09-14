import { Feed } from './components/Feed.tsx'
import { SiteFooter } from './components/SiteFooter.tsx'
import { SiteHeader } from './components/SiteHeader.tsx'

export default function App() {
  return (
    <div className="page">
      <a className="skip" href="#feed">
        Skip to archive
      </a>
      <SiteHeader />
      <Feed />
      <SiteFooter />
    </div>
  )
}
