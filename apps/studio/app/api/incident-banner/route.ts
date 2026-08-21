import { IS_PLATFORM } from 'common'
import { NextResponse } from 'next/server'

import { InternalServerError } from '@/lib/api/apiHelpers'
import { getBannerIncidents } from '@/lib/api/incident-banner'

/**
 * Cache on CDN for 5 minutes
 * Allow serving stale content for 1 minute while revalidating
 */
const CACHE_CONTROL_SETTINGS = 'public, s-maxage=300, stale-while-revalidate=60'

export async function OPTIONS() {
  if (!IS_PLATFORM) return new Response(null, { status: 404 })
  return new Response(null, {
    status: 204,
    headers: {
      Allow: 'GET, HEAD, OPTIONS',
    },
  })
}

export async function HEAD() {
  if (!IS_PLATFORM) return new Response(null, { status: 404 })
  return new Response(null, {
    status: 200,
    headers: { 'Cache-Control': CACHE_CONTROL_SETTINGS },
  })
}

export async function GET() {
  if (!IS_PLATFORM) return new Response(null, { status: 404 })

  try {
    const incidents = await getBannerIncidents()
    return NextResponse.json(
      { incidents },
      { headers: { 'Cache-Control': CACHE_CONTROL_SETTINGS } }
    )
  } catch (error) {
    let errorCode = 500
    const headers = new Headers()

    if (error instanceof InternalServerError) {
      if (typeof error.details?.status === 'number') errorCode = error.details.status
      if (errorCode === 420) errorCode = 429
      if (errorCode === 429 && typeof error.details?.retryAfter === 'string') {
        headers.set('Retry-After', error.details.retryAfter)
      }
      console.error('Failed to fetch incident.io incidents: %O', {
        message: error.message,
        details: error.details,
      })
    } else {
      console.error('Unexpected error fetching incident.io incidents: %O', error)
    }

    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: errorCode, headers }
    )
  }
}
