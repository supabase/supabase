import { describe, expect, it } from 'vitest'

import { CLICK_ID_KEYS } from './first-referrer-cookie'
import { getFirstTouchAttributionProps } from './telemetry'
import type { SharedTelemetryData } from './telemetry-first-touch-store'

// bfcid is consent-gated, so it must stay out of the pre-consent CLICK_ID_KEYS.
const FIRST_TOUCH_CLICK_IDS = [...CLICK_ID_KEYS, 'bfcid']

const makeTelemetryData = (pageUrl: string) =>
  ({
    page_url: pageUrl,
    pathname: new URL(pageUrl).pathname,
    page_title: 'Test',
    session_id: 'test-session',
    ph: { referrer: 'https://google.com' },
  }) as SharedTelemetryData

describe('getFirstTouchAttributionProps', () => {
  it('sends every click id, and only the expected ones', () => {
    const url = new URL('https://supabase.com/dashboard')
    for (const key of FIRST_TOUCH_CLICK_IDS) url.searchParams.set(key, `${key}-value`)
    url.searchParams.set('not_a_click_id', 'ignored')

    const props = getFirstTouchAttributionProps(makeTelemetryData(url.href))
    const clickIdProps = Object.fromEntries(
      Object.entries(props).filter(([key]) => !key.startsWith('first_touch_'))
    )

    expect(clickIdProps).toEqual(
      Object.fromEntries(FIRST_TOUCH_CLICK_IDS.map((key) => [key, `${key}-value`]))
    )
  })
})
