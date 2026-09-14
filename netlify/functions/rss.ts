import { netlifyFeedConfig, netlifyFeedFunction } from '../../server/feedHandlers.ts'

export default netlifyFeedFunction('rss')
export const config = netlifyFeedConfig('rss')
