import { BASE_PATH } from '@/lib/constants'

// fetch doesn't add Next's basePath, so the route is called with it
export const SEARCH_V2_ENDPOINT = `${BASE_PATH}/api/search_v2`

// a query has to be longer than this to be searched, so nothing is submitted until the third character
export const SEARCH_V2_MIN_CHARACTERS = 2
