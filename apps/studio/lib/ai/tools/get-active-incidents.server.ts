import { IS_PLATFORM } from 'common'

import { contract } from './get-active-incidents'
import { toolFromContract } from './tool-from-contract'
import type { ToolFactory } from './types'
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

export const createTool: ToolFactory<typeof contract> = (ctx) => {
  const { baseUrl } = ctx

  return toolFromContract(contract, ctx, async (_input, { abortSignal }) => {
    if (!IS_PLATFORM) {
      return {
        incidents: [],
        message: 'Incident checking is only available on Supabase platform.',
      }
    }

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

    const statusPageUrl = DEFAULT_STATUS_PAGE_URL

    return {
      incidents: combined,
      message: buildActiveIncidentsMessage(incidents.length, maintenances.length, statusPageUrl),
    }
  })
}
