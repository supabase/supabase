import { NextApiRequest, NextApiResponse } from 'next'

import { IS_PLATFORM } from 'common'
import { InternalServerError } from 'lib/api/apiHelpers'
import { getActiveIncidents, type IncidentInfo } from 'lib/api/incident-status'

/**
 * Cache on browser for 5 minutes
 * Cache on CDN for 5 minutes
 * Allow serving stale content for 1 minute while revalidating
 */
const CACHE_CONTROL_SETTINGS = 'public, max-age=300, s-maxage=300, stale-while-revalidate=60'

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
