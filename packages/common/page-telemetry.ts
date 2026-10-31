import type { FirstReferrerData, MwDiagData } from './first-referrer-cookie'
import { isExternalReferrer, isOAuthRedirectReferrer } from './first-referrer-cookie'
import { posthogClient } from './posthog-client'
import type { SharedTelemetryData } from './telemetry-first-touch-store'
import { getSharedTelemetryData, getTelemetryCookieOptions } from './telemetry-utils'

function getFirstTouchAttributionProps(telemetryData: SharedTelemetryData) {
  const urlString = telemetryData.page_url

  try {
    const url = new URL(urlString)
    url.hash = ''
    const params = url.searchParams

    const getParam = (key: string) => {
      const value = params.get(key)
      return value && value.length > 0 ? value : undefined
    }

    const utmProps = {
      ...(getParam('utm_source') && { $utm_source: getParam('utm_source') }),
      ...(getParam('utm_medium') && { $utm_medium: getParam('utm_medium') }),
      ...(getParam('utm_campaign') && { $utm_campaign: getParam('utm_campaign') }),
      ...(getParam('utm_content') && { $utm_content: getParam('utm_content') }),
      ...(getParam('utm_term') && { $utm_term: getParam('utm_term') }),
    }

    const clickIdProps = {
      ...(getParam('gclid') && { gclid: getParam('gclid') }), // Google Ads
      ...(getParam('gbraid') && { gbraid: getParam('gbraid') }), // Google Ads (iOS)
      ...(getParam('wbraid') && { wbraid: getParam('wbraid') }), // Google Ads (iOS)
      ...(getParam('msclkid') && { msclkid: getParam('msclkid') }), // Microsoft Ads (Bing)
      ...(getParam('fbclid') && { fbclid: getParam('fbclid') }), // Meta (Facebook/Instagram)
      ...(getParam('rdt_cid') && { rdt_cid: getParam('rdt_cid') }), // Reddit Ads
      ...(getParam('ttclid') && { ttclid: getParam('ttclid') }), // TikTok Ads
      ...(getParam('twclid') && { twclid: getParam('twclid') }), // X Ads (Twitter)
      ...(getParam('li_fat_id') && { li_fat_id: getParam('li_fat_id') }), // LinkedIn Ads
      ...(getParam('bfcid') && { bfcid: getParam('bfcid') }), // Freebuff Ads
      ...(getParam('oppref') && { oppref: getParam('oppref') }), // ChatGPT Ads (OpenAI)
    }

    return {
      ...utmProps,
      ...clickIdProps,
      first_touch_url: url.href,
      first_touch_pathname: url.pathname,
      ...(url.search && { first_touch_search: url.search }),
    }
  } catch {
    return {}
  }
}

interface HandlePageTelemetryOptions {
  apiUrl: string
  pathname?: string
  featureFlags?: Record<string, unknown>
  slug?: string
  ref?: string
  telemetryDataOverride?: SharedTelemetryData
  firstReferrerData?: FirstReferrerData | null
  mwDiagData?: MwDiagData | null
}

export function handlePageTelemetry({
  pathname,
  featureFlags,
  slug,
  ref,
  telemetryDataOverride,
  firstReferrerData,
  mwDiagData,
}: HandlePageTelemetryOptions) {
  if (typeof window !== 'undefined') {
    const livePageData = getSharedTelemetryData(pathname)
    const liveReferrer = livePageData.ph.referrer
    const storedReferrer = telemetryDataOverride?.ph?.referrer

    const shouldUseStoredReferrer = Boolean(
      storedReferrer &&
      isExternalReferrer(storedReferrer) &&
      !isOAuthRedirectReferrer(storedReferrer) &&
      (!isExternalReferrer(liveReferrer) || isOAuthRedirectReferrer(liveReferrer))
    )

    const pageData = telemetryDataOverride
      ? {
          ...livePageData,
          ph: {
            ...livePageData.ph,
            referrer: shouldUseStoredReferrer ? storedReferrer! : liveReferrer,
          },
        }
      : { ...livePageData, ph: { ...livePageData.ph } }
    const firstTouchAttributionProps: Record<string, string> = {
      ...(telemetryDataOverride ? getFirstTouchAttributionProps(telemetryDataOverride) : {}),
    }

    const firstReferrerCookiePresent = Boolean(firstReferrerData)
    let firstReferrerCookieConsumed = false

    if (
      firstReferrerData &&
      isExternalReferrer(firstReferrerData.referrer) &&
      !isOAuthRedirectReferrer(firstReferrerData.referrer) &&
      (!isExternalReferrer(pageData.ph.referrer) || isOAuthRedirectReferrer(pageData.ph.referrer))
    ) {
      pageData.ph.referrer = firstReferrerData.referrer
      firstReferrerCookieConsumed = true

      const { utms, click_ids, landing_url } = firstReferrerData

      Object.entries(utms).forEach(([key, value]) => {
        const phKey = key.startsWith('utm_') ? `$${key}` : key
        firstTouchAttributionProps[phKey] = value
      })

      Object.entries(click_ids).forEach(([key, value]) => {
        firstTouchAttributionProps[key] = value
      })

      try {
        const url = new URL(landing_url)
        firstTouchAttributionProps.first_touch_url = url.href
        firstTouchAttributionProps.first_touch_pathname = url.pathname

        if (url.search) {
          firstTouchAttributionProps.first_touch_search = url.search
        } else {
          delete firstTouchAttributionProps.first_touch_search
        }
      } catch {
        // Skip if landing URL is malformed
      }
    }

    const $referrer = pageData.ph.referrer
    const $referring_domain = (() => {
      if (!$referrer) return undefined
      try {
        return new URL($referrer).hostname
      } catch {
        return undefined
      }
    })()

    if (pageData.session_id) {
      document.cookie = `session_id=${pageData.session_id}; ${getTelemetryCookieOptions()}`
    }

    posthogClient.capturePageView({
      $current_url: pageData.page_url,
      $pathname: pageData.pathname,
      $host: new URL(pageData.page_url).hostname,
      ...($referrer && { $referrer }),
      ...($referring_domain && { $referring_domain }),
      ...firstTouchAttributionProps,
      $groups: {
        ...(slug ? { organization: slug } : {}),
        ...(ref ? { project: ref } : {}),
      },
      page_title: pageData.page_title,
      ...(pageData.session_id && { $session_id: pageData.session_id }),
      ...pageData.ph,
      ...Object.fromEntries(
        Object.entries(featureFlags || {}).map(([k, v]) => [`$feature/${k}`, v])
      ),
      // Only included on the initial pageview — subsequent pageviews omit firstReferrerData entirely
      ...(firstReferrerData !== undefined && {
        first_referrer_cookie_present: firstReferrerCookiePresent,
        first_referrer_cookie_consumed: firstReferrerCookieConsumed,
      }),
      ...(mwDiagData && {
        mw_diag_hit: mwDiagData.hit,
        mw_diag_would_stamp: mwDiagData.would_stamp,
        mw_diag_has_existing_cookie: mwDiagData.has_existing_cookie,
      }),
    })
  }

  return Promise.resolve()
}

export function handlePageLeaveTelemetry(
  _API_URL: string,
  pathname: string,
  _featureFlags?: {
    [key: string]: unknown
  },
  _slug?: string,
  _ref?: string
) {
  if (typeof window !== 'undefined') {
    const pageData = getSharedTelemetryData(pathname)
    posthogClient.capturePageLeave({
      $current_url: pageData.page_url,
      $pathname: pageData.pathname,
      page_title: pageData.page_title,
      ...(pageData.session_id && { $session_id: pageData.session_id }),
    })
  }

  return Promise.resolve()
}
