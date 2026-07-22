import { IS_PLATFORM } from 'common'
import { NextResponse } from 'next/server'

import { buildAPIPermissionScopeMap } from './buildAPIPermissionScopeMap'
import { InternalServerError } from '@/lib/api/apiHelpers'

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
    const permissionsScopes = await buildAPIPermissionScopeMap()
    return NextResponse.json(permissionsScopes, {
      headers: { 'Cache-Control': CACHE_CONTROL_SETTINGS },
    })
  } catch (error) {
    let errorCode = 500
    const headers = new Headers()

    if (error instanceof InternalServerError) {
      if (typeof error.details?.status === 'number') errorCode = error.details.status
      if (errorCode === 420) errorCode = 429
      if (errorCode === 429 && typeof error.details?.retryAfter === 'string') {
        headers.set('Retry-After', error.details.retryAfter)
      }
      console.error('Failed to fetch scoped token permission scope map: %O', {
        message: error.message,
        details: error.details,
      })
    } else {
      console.error('Unexpected error fetching scoped token permission scope map: %O', error)
    }

    return NextResponse.json(
      { error: 'Unable to scoped token permission scope map at this time' },
      { status: errorCode, headers }
    )
  }
}
