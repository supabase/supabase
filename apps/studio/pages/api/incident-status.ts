import { IS_PLATFORM } from 'common'
import { NextApiRequest, NextApiResponse } from 'next'

import { InternalServerError } from '@/lib/api/apiHelpers'
import {
  getActiveIncidents,
  type IncidentCache,
  type IncidentInfo,
} from '@/lib/api/incident-status'
import { createAdminClient } from '@/lib/api/supabase-admin'

/**
 * Cache on browser for 5 minutes
 * Cache on CDN for 5 minutes
 * Allow serving stale content for 1 minute while revalidating
 */
const CACHE_CONTROL_SETTINGS = 'public, max-age=300, s-maxage=300, stale-while-revalidate=60'

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

// Default export needed by Next.js convention
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Array<IncidentInfo> | { error: string }>
) {
  if (!IS_PLATFORM) {
    return res.status(404).end()
  }

  const { method } = req

  if (method === 'HEAD') {
    res.setHeader('Cache-Control', CACHE_CONTROL_SETTINGS)
    return res.status(200).end()
  }

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET', 'HEAD'])
    return res.status(405).json({ error: `Method ${method} Not Allowed` })
  }

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

    res.setHeader('Cache-Control', CACHE_CONTROL_SETTINGS)

    return res.status(200).json(enrichedIncidents)
  } catch (error) {
    if (error instanceof InternalServerError) {
      console.error('Failed to fetch active StatusPage incidents: %O', {
        message: error.message,
        details: error.details,
      })
    } else {
      console.error('Unexpected error fetching active StatusPage incidents: %O', error)
    }

    return res.status(500).json({ error: 'Unable to fetch incidents at this time' })
  }
}
