import { netlifyFeedFunction } from '../../server/feedHandlers.ts'

export default netlifyFeedFunction('instagram')

export const config = {
  method: ['GET'],
  path: ['/api/instagram', '/.netlify/functions/instagram'],
}
