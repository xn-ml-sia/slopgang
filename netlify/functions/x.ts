import { netlifyFeedFunction } from '../../server/feedHandlers.ts'

export default netlifyFeedFunction('x')

export const config = {
  method: ['GET'],
  path: ['/api/x', '/.netlify/functions/x'],
}
