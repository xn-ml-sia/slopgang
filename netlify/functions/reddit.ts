import { netlifyFeedFunction } from '../../server/feedHandlers.ts'

export default netlifyFeedFunction('reddit')

export const config = {
  method: ['GET'],
  path: ['/api/reddit', '/.netlify/functions/reddit'],
}
