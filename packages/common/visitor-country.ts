export const VISITOR_COUNTRY_COOKIE_NAME = '_sb_country'

const VISITOR_COUNTRY_COOKIE_MAX_AGE = 24 * 60 * 60

interface MiddlewareRequest {
  headers: { get(name: string): string | null }
  cookies: { get(name: string): { value: string } | undefined }
  nextUrl: { hostname: string }
}

interface MiddlewareResponse {
  cookies: {
    set(
      name: string,
      value: string,
      options?: { path?: string; sameSite?: 'lax'; secure?: boolean; maxAge?: number }
    ): void
    delete(name: string): void
  }
}

export function stampVisitorCountryCookie(
  request: MiddlewareRequest,
  response: MiddlewareResponse
): void {
  const country = request.headers.get('x-vercel-ip-country')?.toUpperCase()
  const existing = request.cookies.get(VISITOR_COUNTRY_COOKIE_NAME)?.value
  if (!country || !/^[A-Z]{2}$/.test(country)) {
    if (existing) response.cookies.delete(VISITOR_COUNTRY_COOKIE_NAME)
    return
  }
  if (existing === country) return

  response.cookies.set(VISITOR_COUNTRY_COOKIE_NAME, country, {
    path: '/',
    sameSite: 'lax',
    secure: request.nextUrl.hostname !== 'localhost',
    maxAge: VISITOR_COUNTRY_COOKIE_MAX_AGE,
  })
}

export function readVisitorCountry(cookie: string): string | undefined {
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${VISITOR_COUNTRY_COOKIE_NAME}=([A-Z]{2})`))
  return match?.[1]
}

export const US_PRIVACY_LINK_LABEL = 'Do Not Sell or Share My Personal Information'
export const DEFAULT_PRIVACY_LINK_LABEL = 'Privacy Settings'

// A failed country lookup must still show the opt-out label.
export function getPrivacyLinkLabel(country: string | undefined): string {
  return country && country !== 'US' ? DEFAULT_PRIVACY_LINK_LABEL : US_PRIVACY_LINK_LABEL
}
