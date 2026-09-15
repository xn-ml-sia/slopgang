import { Catalogue } from '../components/Catalogue.tsx'
import { SiteFooter } from '../components/SiteFooter.tsx'
import { SiteNav } from '../components/SiteNav.tsx'

export function Home() {
  return (
    <>
      <SiteNav current="home" />
      <main>
        <Catalogue />
      </main>
      <SiteFooter compact />
    </>
  )
}
