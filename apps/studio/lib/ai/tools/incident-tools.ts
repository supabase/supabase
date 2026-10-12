import { tool } from 'ai'
import { IS_PLATFORM } from 'common'
import { z } from 'zod'

import type { IncidentInfo } from '@/lib/api/incident-status'
import {
  StatusPageResponseSchema,
  type AffectedComponent,
} from '@/lib/status-page/status-page.schema'

const NO_ACTIVE_INCIDENTS_MESSAGE = 'No active incidents.'
const DEFAULT_STATUS_PAGE_URL = 'https://status.supabase.com'

function timeoutSignal(abortSignal?: AbortSignal) {
  return abortSignal
    ? AbortSignal.any([abortSignal, AbortSignal.timeout(5_000)])
    : AbortSignal.timeout(5_000)
}

function formatAffectedComponents(affectedComponents: Array<AffectedComponent>): Array<string> {
  return affectedComponents.map((component) =>
    component.group_name ? `${component.group_name} / ${component.name}` : component.name
  )
}

function buildActiveIncidentsMessage(
  incidentCount: number,
  maintenanceCount: number,
  statusPageUrl: string
) {
  const parts: Array<string> = []
  if (incidentCount > 0) {
    parts.push(`${incidentCount} active incident${incidentCount === 1 ? '' : 's'}`)
  }
  if (maintenanceCount > 0) {
    parts.push(`${maintenanceCount} in-progress maintenance${maintenanceCount === 1 ? '' : 's'}`)
  }

  const totalCount = incidentCount + maintenanceCount

  return `There ${totalCount === 1 ? 'is' : 'are'} ${parts.join(' and ')} on Supabase infrastructure. If the user's issue appears related, inform them about the ongoing issue(s) and direct them to ${statusPageUrl} for real-time updates.`
}

/**
 * Creates incident-related tools for the AI assistant.
 *
 * @param baseUrl - The base URL for API requests (e.g., https://supabase.com/dashboard)
 *                  This should be the public URL to leverage CDN caching.
 * @param useStatusPageWidget - When true, reads active incidents from the incident.io
 *                              Widget API-backed status page endpoint instead of the
 *                              legacy incident-status endpoint.
 */
export const getIncidentTools = ({
  baseUrl,
  useStatusPageWidget,
}: {
  baseUrl: string
  useStatusPageWidget?: boolean
}) => ({
  get_active_incidents: tool({
    description:
      'Check for active incidents. Use this tool when the user reports issues with any Supabase service, including the database, authentication, realtime, storage, and functions. Possible problems include, but are not limited to, connection issues, timeouts, service unavailability, authentication failures, or unexpected errors.',
    inputSchema: z.object({}),
    execute: async (_input, { abortSignal }) => {
      if (!IS_PLATFORM) {
        return {
          incidents: [],
          message: 'Incident checking is only available on Supabase platform.',
        }
      }

      if (useStatusPageWidget) {
        const response = await fetch(`${baseUrl}/api/status-page`, {
          signal: timeoutSignal(abortSignal),
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch status page: ${response.status}`)
        }

        const json = await response.json()
        const parseResult = StatusPageResponseSchema.safeParse(json)

        if (!parseResult.success) {
          throw new Error(`Failed to parse status page response: ${parseResult.error.message}`)
        }

        const { data } = parseResult

        const incidents = data.ongoing_incidents
          .filter((incident) => incident.visible)
          .map((incident) => ({
            kind: 'incident' as const,
            name: incident.name,
            status: incident.status,
            impact: incident.current_worst_impact,
            affected_components: formatAffectedComponents(incident.affected_components),
            last_update_message: incident.last_update_message ?? null,
            url: incident.url,
          }))

        const maintenances = data.in_progress_maintenances
          .filter((maintenance) => maintenance.visible)
          .map((maintenance) => ({
            kind: 'maintenance' as const,
            name: maintenance.name,
            status: maintenance.status,
            affected_components: formatAffectedComponents(maintenance.affected_components),
            last_update_message: maintenance.last_update_message ?? null,
            url: maintenance.url,
            started_at: maintenance.started_at,
          }))

        const combined = [...incidents, ...maintenances]

        if (combined.length === 0) {
          return {
            incidents: [],
            message: NO_ACTIVE_INCIDENTS_MESSAGE,
          }
        }

        const statusPageUrl = data.page_url || DEFAULT_STATUS_PAGE_URL

        return {
          incidents: combined,
          message: buildActiveIncidentsMessage(
            incidents.length,
            maintenances.length,
            statusPageUrl
          ),
        }
      }

      const response = await fetch(`${baseUrl}/api/incident-status`, {
        signal: timeoutSignal(abortSignal),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch incident status: ${response.status}`)
      }

      const incidents: IncidentInfo[] = await response.json()

      if (incidents.length === 0) {
        return {
          incidents: [],
          message: NO_ACTIVE_INCIDENTS_MESSAGE,
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
        message: buildActiveIncidentsMessage(incidents.length, 0, DEFAULT_STATUS_PAGE_URL),
      }
    },
  }),
})
