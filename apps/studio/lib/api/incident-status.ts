import z from 'zod'

import { IS_PLATFORM } from 'common'
import { InternalServerError } from 'lib/api/apiHelpers'

export type IncidentCache = {
  affected_regions: Array<string> | null
  affects_project_creation: boolean
}

export type IncidentMetadata = {
  dashboard_metadata?: {
    show_banner?: boolean
  }
}

export type IncidentInfo = {
  id: string
  name: string
  status: string
  impact: string
  active_since: string
  metadata: IncidentMetadata
  cache?: IncidentCache | null
}

const STATUSPAGE_API_URL = 'https://api.statuspage.io/v1'
const STATUSPAGE_PAGE_ID = process.env.STATUSPAGE_PAGE_ID
const STATUSPAGE_API_KEY = process.env.STATUSPAGE_API_KEY

function getIncidentsEndpoint(): string {
  return `${STATUSPAGE_API_URL}/pages/${STATUSPAGE_PAGE_ID}/incidents/unresolved`
}

const StatusPageIncidentsSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    status: z.string(),
    created_at: z.string(),
    scheduled_for: z.string().nullable(),
    impact: z.string(),
    metadata: z
      .object({
        dashboard_metadata: z
          .object({
            show_banner: z.boolean().optional(),
          })
          .optional(),
      })
      .optional()
      .default({}),
  })
)

/**
 * Fetches active incidents from the StatusPage API.
 * This function is used both by the API route and the AI assistant.
 *
 * @returns Array of active incidents
 * @throws InternalServerError if StatusPage is not configured or returns an error
 */
export async function getActiveIncidents(): Promise<IncidentInfo[]> {
  if (!IS_PLATFORM) {
    return []
  }

  if (!STATUSPAGE_PAGE_ID) {
    throw new InternalServerError('StatusPage page ID is not configured')
  }

  if (!STATUSPAGE_API_KEY) {
    throw new InternalServerError('StatusPage API key is not configured')
  }

  const response = await fetch(getIncidentsEndpoint(), {
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
    const hasNoScheduledTime = !incident.scheduled_for
    if (hasNoScheduledTime) {
      return true
    }

    const scheduledTime = Date.parse(incident.scheduled_for!)
    const isScheduledTimeInvalid = Number.isNaN(scheduledTime)
    if (isScheduledTimeInvalid) {
      // Keep the record but note it locally for debugging
      console.warn('Encountered incident with invalid scheduled_for date', {
        incidentId: incident.id,
        scheduled_for: incident.scheduled_for,
      })
      return true
    }

    const hasScheduledTimePassed = scheduledTime <= now
    return hasScheduledTimePassed
  })

  return activeIncidents.map((incident) => ({
    id: incident.id,
    name: incident.name,
    status: incident.status,
    impact: incident.impact,
    active_since: incident.scheduled_for ?? incident.created_at,
    metadata: incident.metadata,
  }))
}
