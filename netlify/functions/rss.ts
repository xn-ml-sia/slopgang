import { netlifyFeedFunction } from '../../server/feedHandlers.ts'

export default netlifyFeedFunction('rss')

export const config = {
  method: ['GET'],
  path: ['/api/rss', '/.netlify/functions/rss'],
}
