import { DASHBOARD_SIGN_UP_URL } from 'common/constants/dashboard-urls'

export { DASHBOARD_SIGN_IN_URL, DASHBOARD_SIGN_UP_URL } from 'common/constants/dashboard-urls'
export const DASHBOARD_URL = 'https://supabase.com/dashboard'

/** Homepage/product "Start your project" CTA: sign-up for guests, dashboard for signed-in users. */
export function getDashboardCtaHref(isLoggedIn: boolean): string {
  return isLoggedIn ? DASHBOARD_URL : DASHBOARD_SIGN_UP_URL
}

const DASHBOARD_CTA_HREFS = new Set([DASHBOARD_URL, DASHBOARD_SIGN_UP_URL])

/** Rewrite static dashboard/sign-up CTA hrefs when the visitor is already signed in. */
export function resolveDashboardCtaHref(href: string, isLoggedIn: boolean): string {
  if (!DASHBOARD_CTA_HREFS.has(href)) return href
  return getDashboardCtaHref(isLoggedIn)
}
