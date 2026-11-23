import { describe, expect, it, vi } from 'vitest'

import {
  getPrivacyLinkLabel,
  readVisitorCountry,
  stampVisitorCountryCookie,
  VISITOR_COUNTRY_COOKIE_NAME,
} from './visitor-country'

const US_LABEL = 'Do Not Sell or Share My Personal Information'

describe('getPrivacyLinkLabel', () => {
  it('shows the opt-out label to US visitors', () => {
    expect(getPrivacyLinkLabel('US')).toBe(US_LABEL)
  })

  it('shows Privacy Settings to non-US visitors', () => {
    expect(getPrivacyLinkLabel('DE')).toBe('Privacy Settings')
  })

  it('shows the opt-out label when the country is unknown', () => {
    expect(getPrivacyLinkLabel(undefined)).toBe(US_LABEL)
  })
})

describe('readVisitorCountry', () => {
  it('reads the country among other cookies', () => {
    expect(readVisitorCountry(`a=1; ${VISITOR_COUNTRY_COOKIE_NAME}=GB; b=2`)).toBe('GB')
  })

  it('returns undefined when the cookie is missing', () => {
    expect(readVisitorCountry('a=1')).toBeUndefined()
  })
})

describe('stampVisitorCountryCookie', () => {
  const stamp = (country: string | null, { existing = '', hostname = 'supabase.com' } = {}) => {
    const set = vi.fn()
    const remove = vi.fn()
    stampVisitorCountryCookie(
      {
        headers: { get: () => country },
        cookies: { get: () => (existing ? { value: existing } : undefined) },
        nextUrl: { hostname },
      },
      { cookies: { set, delete: remove } }
    )
    return { set, remove }
  }
  const setup = (country: string | null, existing?: string) => stamp(country, { existing }).set

  it('copies the Vercel country header into the cookie', () => {
    expect(setup('us')).toHaveBeenCalledWith(VISITOR_COUNTRY_COOKIE_NAME, 'US', {
      path: '/',
      sameSite: 'lax',
      secure: true,
      maxAge: 86400,
    })
  })

  it('drops the secure flag on localhost', () => {
    expect(stamp('US', { hostname: 'localhost' }).set).toHaveBeenCalledWith(
      VISITOR_COUNTRY_COOKIE_NAME,
      'US',
      expect.objectContaining({ secure: false })
    )
  })

  it('clears a stale cookie when the header is missing', () => {
    const { set, remove } = stamp(null, { existing: 'DE' })
    expect(set).not.toHaveBeenCalled()
    expect(remove).toHaveBeenCalledWith(VISITOR_COUNTRY_COOKIE_NAME)
  })

  it('skips the write when the header is missing or invalid', () => {
    expect(setup(null)).not.toHaveBeenCalled()
    expect(setup('XX1')).not.toHaveBeenCalled()
  })

  it('skips the write when the cookie already matches', () => {
    expect(setup('FR', 'FR')).not.toHaveBeenCalled()
  })
})
