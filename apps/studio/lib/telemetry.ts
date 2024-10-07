import { Sha256 } from '@aws-crypto/sha256-browser'
import type { NextRouter } from 'next/router'

import { post } from 'lib/common/fetch'
import { API_URL, IS_PLATFORM, LOCAL_STORAGE_KEYS } from 'lib/constants'
import type { User } from 'types'

export interface TelemetryProps {
  language: string
  search?: string
  userAgent?: string
  viewportHeight?: number
  viewportWidth?: number
}

/**
 * Sends a telemetry event to Logflare for tracking by the product team.
 */
const sendEvent = (
  event: {
    category: string
    action: string
    label: string
    value?: string
  },
  phProps: TelemetryProps,
  router: NextRouter
) => {
  if (!IS_PLATFORM) return

  const consent =
    typeof window !== 'undefined'
      ? localStorage.getItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT)
      : null
  if (consent !== 'true') return

  const { category, action, label, value } = event

  // remove # section from router.asPath as it
  // often includes sensitive information
  // such as access/refresh tokens
  const page_location = router.asPath.split('#')[0]

  return post(
    `${API_URL}/telemetry/event`,
    {
      action: action,
      pageUrl: document?.location.href,
      pageTitle: document?.title,
      pathname: page_location,
      ph: {
        referrer: document?.referrer,
        ...phProps,
      },
      customProperties: {
        category,
        label,
        value,
      },
    },
    {
      credentials: 'include',
    }
  )
}

/**
 * TODO: GA4 doesn't have identify method.
 * We may or may not need gaClientId here. Confirm later
 */
const sendIdentify = (user: User) => {
  if (!IS_PLATFORM) return

  const consent =
    typeof window !== 'undefined'
      ? localStorage.getItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT)
      : null
  if (consent !== 'true') return

  return post(
    `${API_URL}/telemetry/identify`,
    {
      userId: user.gotrue_id,
    },
    {
      credentials: 'include',
    }
  )
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
  sendEvent,
  sendIdentify,
}

export default Telemetry
