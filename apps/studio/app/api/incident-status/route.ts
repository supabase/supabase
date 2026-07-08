import { IS_PLATFORM } from 'common'
import { NextResponse } from 'next/server'

import { InternalServerError } from '@/lib/api/apiHelpers'
import { getActiveIncidents, type IncidentCache } from '@/lib/api/incident-status'
import { createAdminClient } from '@/lib/api/supabase-admin'

/**
 * Cache on CDN for 5 minutes
 * Allow serving stale content for 1 minute while revalidating
 */
const CACHE_CONTROL_SETTINGS = 'public, s-maxage=300, stale-while-revalidate=60'

async function fetchIncidentCache(incidentIds: Array<string>): Promise<Map<string, IncidentCache>> {
  const cacheMap = new Map<string, IncidentCache>()

  if (incidentIds.length === 0) return cacheMap

  const supabase = createAdminClient()

  try {
    const { data, error } = await supabase
      .from('incident_status_cache')
      .select('incident_id, affected_regions, affects_project_creation')
      .in('incident_id', incidentIds)

    if (error) {
      console.error('Failed to fetch incident_status_cache: %O', error)
      return cacheMap
    }

    for (const row of data ?? []) {
      cacheMap.set(row.incident_id, {
        affected_regions: row.affected_regions ?? null,
        affects_project_creation: row.affects_project_creation,
      })
    }
  } catch (error) {
    console.error('Unexpected error fetching incident_status_cache: %O', error)
  }

  return cacheMap
}

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
    const allIncidents = await getActiveIncidents()

    const bannerIncidents = allIncidents.filter(
      (incident) =>
        incident.impact !== 'maintenance' &&
        incident.metadata?.dashboard_metadata?.show_banner === true
    )

    const cacheMap = await fetchIncidentCache(bannerIncidents.map((i) => i.id))

    const enrichedIncidents = bannerIncidents.map((incident) => ({
      ...incident,
      cache: cacheMap.get(incident.id) ?? null,
    }))

    return NextResponse.json(enrichedIncidents, {
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
      console.error('Failed to fetch active StatusPage incidents: %O', {
        message: error.message,
        details: error.details,
      })
    } else {
      console.error('Unexpected error fetching active StatusPage incidents: %O', error)
    }

    return NextResponse.json(
      { error: 'Unable to fetch incidents at this time' },
      { status: errorCode, headers }
    )
  }
}
