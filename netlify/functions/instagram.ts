import { netlifyFeedConfig, netlifyFeedFunction } from '../../server/feedHandlers.ts'

export default netlifyFeedFunction('instagram')
export const config = netlifyFeedConfig('instagram')
