import { IS_PLATFORM } from 'common'
import { NextResponse } from 'next/server'

import { InternalServerError } from '@/lib/api/apiHelpers'
import { getStatusPage } from '@/lib/api/status-page'

const CACHE_CONTROL_SUCCESS = 'public, s-maxage=300, stale-while-revalidate=300'
const CACHE_CONTROL_DEGRADED = 'public, s-maxage=60, stale-while-revalidate=60'
const CACHE_CONTROL_ERROR = 'no-store'

export async function OPTIONS() {
  if (!IS_PLATFORM) return new Response(null, { status: 404 })
  return new Response(null, {
    status: 204,
    headers: { Allow: 'GET, HEAD, OPTIONS' },
  })
}

export async function HEAD() {
  if (!IS_PLATFORM) return new Response(null, { status: 404 })
  return new Response(null, {
    status: 200,
    headers: { 'Cache-Control': CACHE_CONTROL_SUCCESS },
  })
}

export async function GET() {
  if (!IS_PLATFORM) return new Response(null, { status: 404 })

  try {
    const { data, isDegraded } = await getStatusPage()
    return NextResponse.json(data, {
      headers: { 'Cache-Control': isDegraded ? CACHE_CONTROL_DEGRADED : CACHE_CONTROL_SUCCESS },
    })
  } catch (error) {
    let errorCode = 500
    const headers = new Headers({ 'Cache-Control': CACHE_CONTROL_ERROR })

    if (error instanceof InternalServerError) {
      if (typeof error.details?.status === 'number') errorCode = error.details.status
      if (errorCode === 420) errorCode = 429
      if (errorCode === 429 && typeof error.details?.retryAfter === 'string') {
        headers.set('Retry-After', error.details.retryAfter)
      }
      console.error(
        'Failed to fetch incident.io status page: %s',
        JSON.stringify(
          {
            message: error.message,
            details: error.details,
          },
          null,
          2
        )
      )
    } else {
      console.error(
        'Unexpected error fetching incident.io status page: %s',
        JSON.stringify(error, null, 2)
      )
    }

    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: errorCode, headers }
    )
  }
}
