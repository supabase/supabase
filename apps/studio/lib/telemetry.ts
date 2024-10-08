import { Sha256 } from '@aws-crypto/sha256-browser'

import { post } from 'lib/common/fetch'
import { API_URL, IS_PLATFORM, LOCAL_STORAGE_KEYS } from 'lib/constants'
import type { User } from 'types'

export interface TelemetryProps {
  screenResolution?: string
  language: string
}

/**
 * TODO: GA4 doesn't have identify method.
 * We may or may not need gaClientId here. Confirm later
 */
const sendIdentify = (user: User, gaProps?: TelemetryProps) => {
  if (!IS_PLATFORM) return

  const consent =
    typeof window !== 'undefined'
      ? localStorage.getItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT)
      : null
  if (consent !== 'true') return

  return post(`${API_URL}/telemetry/identify`, {
    user,
    ga: {
      screen_resolution: gaProps?.screenResolution,
      language: gaProps?.language,
    },
  })
}

/**
 * Generates a unique identifier for an anonymous user based on their gotrue id.
 */
export const getAnonId = async (id: string) => {
  const hash = new Sha256()
  hash.update(id)
  const u8Array = await hash.digest()
  const binString = Array.from(u8Array, (byte) => String.fromCodePoint(byte)).join('')
  const b64encoded = btoa(binString)
  return b64encoded
}

const Telemetry = {
  sendIdentify,
}

export default Telemetry
