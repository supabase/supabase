import { BASE_PATH } from '@/lib/constants'

// PostHog multivariate flag, already configured on staging.
export const SEARCH_V2_FLAG = 'docs-search-v2'

export type SearchV2Variant = 'control' | 'search-v2-active'

// fetch doesn't add Next's basePath, so the route is called with it
export const SEARCH_V2_ENDPOINT = `${BASE_PATH}/api/search_v2`
