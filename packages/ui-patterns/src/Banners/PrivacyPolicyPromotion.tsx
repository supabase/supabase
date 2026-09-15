'use client'

import { useEffect, useState } from 'react'

export const PRIVACY_POLICY_URL = '/privacy'
export const PRIVACY_POLICY_CONTACT_EMAIL = 'privacy@supabase.com'
export const PRIVACY_POLICY_BANNER_DISMISSAL_KEY = 'announcement_privacy_policy_v4'

/**
 * Single toggle for the Privacy Policy v4 banner (entity-name change: Supabase, Inc. ->
 * Supabase Pte. Ltd.).
 *
 * This must stay `null` until the Privacy Policy v4 update is actually live at
 * https://supabase.com/privacy — set it to that go-live date/time (any value `Date` accepts,
 * e.g. `'2026-10-01T08:00:00-07:00'`) to schedule the banner, or leave it `null` and flip it
 * later once the exact time is known. Do not set a date ahead of the policy update shipping.
 */
export const PRIVACY_POLICY_V4_LIVE_DATE: string | null = null

const PRIVACY_POLICY_V4_LIVE_DATE_MS = PRIVACY_POLICY_V4_LIVE_DATE
  ? new Date(PRIVACY_POLICY_V4_LIVE_DATE).getTime()
  : null

const MAX_TIMEOUT_MS = 2_147_483_647

/** Pure comparison, exported for testing independently of the `PRIVACY_POLICY_V4_LIVE_DATE` value. */
export const isLiveAt = (now: number, liveDateMs: number | null) =>
  liveDateMs !== null && now >= liveDateMs

export const isPrivacyPolicyBannerActive = (now = Date.now()) =>
  isLiveAt(now, PRIVACY_POLICY_V4_LIVE_DATE_MS)

export const usePrivacyPolicyBannerActive = () => {
  const [isActive, setIsActive] = useState(() => isPrivacyPolicyBannerActive())

  useEffect(() => {
    if (isActive || PRIVACY_POLICY_V4_LIVE_DATE_MS === null) return

    const remainingMs = PRIVACY_POLICY_V4_LIVE_DATE_MS - Date.now()
    if (remainingMs <= 0) {
      setIsActive(true)
      return
    }

    const timeoutId = setTimeout(() => setIsActive(true), Math.min(remainingMs, MAX_TIMEOUT_MS))
    return () => clearTimeout(timeoutId)
  }, [isActive])

  return isActive
}
