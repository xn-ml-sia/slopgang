import { FeedWall } from '../components/FeedWall.tsx'
import { SiteNav } from '../components/SiteNav.tsx'

export function Home() {
  return (
    <div className="feed">
      <SiteNav current="home" />
      <main>
        <FeedWall />
      </main>
    </div>
  )
}
