import { tool } from 'ai'
import { z } from 'zod'

const INCIDENTS_URL = 'https://status.supabase.com/api/v2/incidents/unresolved.json'
const FETCH_TIMEOUT_MS = 5_000

type StatuspageIncident = {
  name?: string
  status?: string
  impact?: string
  started_at?: string
  created_at?: string
}

function compactIncident(incident: StatuspageIncident) {
  return {
    name: incident.name ?? 'Unknown incident',
    status: incident.status ?? 'unknown',
    impact: incident.impact ?? 'unknown',
    active_since: incident.started_at ?? incident.created_at ?? null,
  }
}

export const getIncidentTools = () => ({
  get_active_incidents: tool({
    description:
      'Check for active incidents. Use this tool when the user reports issues with any Supabase service, including the database, authentication, realtime, storage, and functions. Possible problems include, but are not limited to, connection issues, timeouts, service unavailability, authentication failures, or unexpected errors.',
    inputSchema: z.object({}),
    execute: async () => {
      try {
        const response = await fetch(INCIDENTS_URL, {
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        })

        if (!response.ok) {
          console.warn('Failed to fetch incident status:', response.status)
          return { incidents: [], error: 'Unable to check incident status at this time.' }
        }

        const body: { incidents?: StatuspageIncident[] } = await response.json()
        const incidents = Array.isArray(body.incidents) ? body.incidents : []

        if (incidents.length === 0) {
          return {
            incidents: [],
            message:
              'No active incidents. The issue the user is experiencing is likely not related to a Supabase infrastructure problem.',
          }
        }

        const incidentSummaries = incidents.map(compactIncident)

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
