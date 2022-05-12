import { detectBrowser } from 'lib/helpers'

/**
 * Formats the user datetime string into a format that's
 * readable across browsers.
 * - Postgres: 2022-05-12 09:24:12.639463+00
 *
 * These are the acceptable formats that Joshen has experimented so far
 * - Chrome:   2022-05-12 09:24:12.639463+00 (No format required)
 * - Firefox:  2022-05-12 09:24:12.639463+00 (No format required)
 * - Safari:   2022-05-12T09:24:12.639463+00
 *
 * Note: I've only seen this issue on the Auth page, hence why keeping
 * this util here for now. But if it does happen elsewhere i'll bring it
 * to lib/helpers
 */
export const formatUserDateString = (dateString: string) => {
  const browser = detectBrowser()
  if (browser === 'Safari') {
    return dateString.replace(' ', 'T')
  } else {
    return dateString
  }
}
