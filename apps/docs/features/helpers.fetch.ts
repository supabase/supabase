/**
 * Next.js extends native `fetch` with revalidation options.
 *
 * This module provides some reusable utility functions to set revalidation
 * options for `fetch`, for example when it needs to be passed to a
 * third-party API.
 */

import { ONE_DAY_IN_SECONDS } from './helpers.time'

function fetchWithNextOptions(options: NextFetchRequestConfig) {
  return (info: RequestInfo) => fetch(info, { next: options })
}

const fetchRevalidatePerDay = fetchWithNextOptions({ revalidate: ONE_DAY_IN_SECONDS })

export { fetchWithNextOptions, fetchRevalidatePerDay }
