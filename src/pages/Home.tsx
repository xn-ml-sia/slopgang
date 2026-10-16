import { FeedWall } from '../components/FeedWall.tsx'
import { SiteNav } from '../components/SiteNav.tsx'

export function Home() {
  return (
    <div className="feed">
      <SiteNav current="strange-fruit" />
      <main>
        <FeedWall />
      </main>
    </div>
  )
}
