import { tool } from 'ai'
import { z } from 'zod'

import { IS_PLATFORM } from 'common'
import type { IncidentInfo } from 'lib/api/incident-status'

/**
 * Creates incident-related tools for the AI assistant.
 *
 * @param baseUrl - The base URL for API requests (e.g., https://supabase.com/dashboard)
 *                  This should be the public URL to leverage CDN caching.
 */
export const getIncidentTools = ({ baseUrl }: { baseUrl: string }) => ({
  get_active_incidents: tool({
    description:
      'Check for active incidents. Use this tool when the user reports issues with any Supabase service, including the database, authentication, realtime, storage, and functions. Possible problems include, but are not limited to, connection issues, timeouts, service unavailability, authentication failures, or unexpected errors.',
    inputSchema: z.object({}),
    execute: async () => {
      if (!IS_PLATFORM) {
        return {
          incidents: [],
          message: 'Incident checking is only available on Supabase platform.',
        }
      }

      try {
        const response = await fetch(`${baseUrl}/api/incident-status`, {
          signal: AbortSignal.timeout(5_000),
        })

        if (!response.ok) {
          console.warn('Failed to fetch incident status:', response.status)
          return { incidents: [], error: 'Unable to check incident status at this time.' }
        }

        const incidents: IncidentInfo[] = await response.json()

        if (incidents.length === 0) {
          return {
            incidents: [],
            message:
              'No active incidents. The issue the user is experiencing is likely not related to a Supabase infrastructure problem.',
          }
        }

        const incidentSummaries = incidents.map((incident) => ({
          name: incident.name,
          status: incident.status,
          impact: incident.impact,
          active_since: incident.active_since,
        }))

        return {
          incidents: incidentSummaries,
          message: `There ${incidents.length === 1 ? 'is' : 'are'} ${incidents.length} active incident${incidents.length === 1 ? '' : 's'} on Supabase infrastructure. If the user's issue appears related, inform them about the ongoing incident(s) and direct them to https://status.supabase.com for real-time updates.`,
        }
      } catch (error) {
        console.warn('Failed to fetch incident status:', error)
        return { incidents: [], error: 'Unable to check incident status at this time.' }
      }
    },
  }),
})
