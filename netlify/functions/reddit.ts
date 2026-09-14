import { netlifyFeedConfig, netlifyFeedFunction } from '../../server/feedHandlers.ts'

export default netlifyFeedFunction('reddit')
export const config = netlifyFeedConfig('reddit')
