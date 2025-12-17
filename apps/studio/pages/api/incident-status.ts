import { NextApiRequest, NextApiResponse } from 'next'
import z from 'zod'

import { IS_PLATFORM } from 'common'
import { InternalServerError } from 'lib/api/apiHelpers'

type IncidentInfo = {
  id: string
  name: string
  status: string
  active_since: string
}

const STATUSPAGE_API_URL = 'https://api.statuspage.io/v1'
const STATUSPAGE_PAGE_ID = process.env.STATUSPAGE_PAGE_ID
const STATUSPAGE_API_KEY = process.env.STATUSPAGE_API_KEY

console.log('!! Logging statuspage variables...')
console.log('STATUSPAGE_PAGE_ID', STATUSPAGE_PAGE_ID)
console.log('STATUSPAGE_API_KEY', STATUSPAGE_API_KEY)

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
  })
)

const getMockIncidents = (count: number = 2): IncidentInfo[] => {
  const now = new Date()
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000)

  const allMockIncidents: IncidentInfo[] = [
    {
      id: 'mock-incident-1',
      name: 'Database connection issues affecting some regions',
      status: 'investigating',
      active_since: twoHoursAgo.toISOString(),
    },
    {
      id: 'mock-incident-2',
      name: 'Increased latency in API responses',
      status: 'monitoring',
      active_since: threeDaysAgo.toISOString(),
    },
    {
      id: 'mock-incident-3',
      name: 'Authentication service experiencing intermittent failures',
      status: 'identified',
      active_since: thirtyMinutesAgo.toISOString(),
    },
  ]

  return allMockIncidents.slice(0, Math.max(1, Math.min(count, allMockIncidents.length)))
}

const getActiveIncidents = async (useMock: boolean = false, useRealApi: boolean = false, mockCount?: number): Promise<IncidentInfo[]> => {
  // Return mock data if explicitly requested or if environment variables are not configured
  // This allows for local development and design testing
  const hasEnvVars = STATUSPAGE_PAGE_ID && STATUSPAGE_PAGE_ID.trim() !== '' && STATUSPAGE_API_KEY && STATUSPAGE_API_KEY.trim() !== ''
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  // Use mock data if:
  // 1. Explicitly requested via useMock
  // 2. Env vars are not configured
  // 3. In development mode UNLESS explicitly requesting real API
  const shouldUseMock = useMock || !hasEnvVars || (isDevelopment && !useRealApi)
  
  if (shouldUseMock) {
    console.log('[incident-status] Using mock data', { useMock, useRealApi, mockCount, hasEnvVars, isDevelopment, STATUSPAGE_PAGE_ID: !!STATUSPAGE_PAGE_ID, STATUSPAGE_API_KEY: !!STATUSPAGE_API_KEY })
    const mockData = getMockIncidents(mockCount)
    console.log('[incident-status] Mock data generated:', mockData.length, 'incidents')
    return mockData
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
    active_since: incident.scheduled_for ?? incident.created_at,
  }))
}

// Default export needed by Next.js convention
// eslint-disable-next-line no-restricted-exports
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<IncidentInfo[] | { error: string }>
) {
  const { method } = req

  // Support query parameters for mock mode and incident count
  const useMock = req.query.mock === 'true'
  const useRealApi = req.query.useRealApi === 'true'
  const mockCount = req.query.count ? parseInt(req.query.count as string, 10) : undefined

  // Allow endpoint to work in local development
  // getActiveIncidents will automatically use mock data if env vars aren't set
  // Only block if we're on platform and trying to use real API without proper config
  // (But allow mock mode or when env vars aren't set for local dev)

  if (method === 'HEAD') {
    res.setHeader('Cache-Control', CACHE_CONTROL_SETTINGS)
    return res.status(200).end()
  }

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET', 'HEAD'])
    return res.status(405).json({ error: `Method ${method} Not Allowed` })
  }

  try {
    console.log('[incident-status] Request received - logging statuspage variables:')
    console.log('[incident-status] STATUSPAGE_PAGE_ID:', STATUSPAGE_PAGE_ID || 'NOT SET')
    console.log(
      '[incident-status] STATUSPAGE_API_KEY:',
      STATUSPAGE_API_KEY ? '***SET***' : 'NOT SET'
    )
    console.log('[incident-status] useMock:', useMock, 'useRealApi:', useRealApi, 'mockCount:', mockCount)

    const incidents = await getActiveIncidents(useMock, useRealApi, mockCount)

    console.log('[incident-status] Returning incidents:', incidents.length, incidents)

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
