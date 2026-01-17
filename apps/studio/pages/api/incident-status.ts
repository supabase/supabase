import { NextApiRequest, NextApiResponse } from 'next'
import z from 'zod'

import { IS_PLATFORM } from 'common'
import { InternalServerError } from 'lib/api/apiHelpers'
import type { IncidentInfo } from 'lib/api/incident-status'

const STATUSPAGE_API_URL = 'https://api.statuspage.io/v1'
const STATUSPAGE_PAGE_ID = process.env.STATUSPAGE_PAGE_ID
const STATUSPAGE_API_KEY = process.env.STATUSPAGE_API_KEY

const INCIDENTS_ENDPOINT = `${STATUSPAGE_API_URL}/pages/${STATUSPAGE_PAGE_ID}/incidents/unresolved`

/**
 * Cache on browser for 5 minutes
 * Cache on CDN for 5 minutes
 * Allow serving stale content for 1 minute while revalidating
 */
const CACHE_CONTROL_SETTINGS = 'public, max-age=300, s-maxage=300, stale-while-revalidate=60'

const StatusPageIncidentsSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    status: z.string(),
    created_at: z.string(),
    scheduled_for: z.string().nullable(),
    impact: z.string(),
  })
)

const getActiveIncidents = async (): Promise<IncidentInfo[]> => {
  if (!STATUSPAGE_PAGE_ID) {
    throw new InternalServerError('StatusPage page ID is not configured')
  }

  if (!STATUSPAGE_API_KEY) {
    throw new InternalServerError('StatusPage API key is not configured')
  }

  const response = await fetch(INCIDENTS_ENDPOINT, {
    headers: {
      Authorization: `OAuth ${STATUSPAGE_API_KEY}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(30_000),
  })
  const responseText = await response.text()

  if (!response.ok) {
    throw new InternalServerError(`StatusPage API responded with ${response.status}`, {
      status: response.status,
      body: responseText,
    })
  }

  let incidentsJson: unknown
  try {
    incidentsJson = JSON.parse(responseText)
  } catch (error) {
    throw new InternalServerError('StatusPage API response could not be parsed as JSON', {
      error: error instanceof Error ? error.message : error,
      body: responseText,
    })
  }

  const result = StatusPageIncidentsSchema.safeParse(incidentsJson)

  if (!result.success) {
    throw new InternalServerError('StatusPage API response did not match expected schema', {
      issues: result.error.issues,
    })
  }

  const now = Date.now()
  const activeIncidents = result.data.filter((incident) => {
    if (!incident.scheduled_for) {
      return true
    }

    const scheduledTime = Date.parse(incident.scheduled_for)
    if (Number.isNaN(scheduledTime)) {
      // Keep the record but note it locally for debugging
      console.warn('Encountered incident with invalid scheduled_for date', {
        incidentId: incident.id,
        scheduled_for: incident.scheduled_for,
      })
      return true
    }

    return scheduledTime <= now
  })

  return activeIncidents.map((incident) => ({
    id: incident.id,
    name: incident.name,
    status: incident.status,
    impact: incident.impact,
    active_since: incident.scheduled_for ?? incident.created_at,
  }))
}

// Default export needed by Next.js convention
// eslint-disable-next-line no-restricted-exports
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<IncidentInfo[] | { error: string }>
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
    const incidents = await getActiveIncidents()

    res.setHeader('Cache-Control', CACHE_CONTROL_SETTINGS)

    return res.status(200).json(incidents)
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
