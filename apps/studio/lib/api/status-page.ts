import { z } from 'zod'

import customContentRaw from '@/hooks/custom-content/custom-content.json'
import { InternalServerError } from '@/lib/api/apiHelpers'
import {
  annotateWidget,
  mergeLinkedFlags,
  type ResponseIncident,
  type ResponseIncidentFlags,
} from '@/lib/api/status-page.utils'
import {
  WidgetResponseSchema,
  type StatusPageResponse,
  type WidgetResponse,
} from '@/lib/status-page/status-page.schema'

const HIDE_BANNER_FIELD_ID = '01M3D30MY0GQ1284ERHHV4DFAT'
const BANNER_LEAD_DAYS_FIELD_ID = '01M3D332BQVSDE4ZGK86X6X69V'

const WIDGET_TIMEOUT_MS = 10_000
const LINK_TIMEOUT_MS = 5_000
const INCIDENT_TIMEOUT_MS = 5_000
const MAX_RETRIES = 2

export type StatusPageResult = { data: StatusPageResponse; isDegraded: boolean }

const LinkedResponseIncidentsSchema = z.object({
  incidents: z.array(z.object({ id: z.string(), linked_at: z.string() })),
})

const CustomFieldValueSchema = z.object({
  value_option: z.object({ value: z.string() }).nullish(),
  value_text: z.string().nullish(),
  value_numeric: z.string().nullish(),
})

const ResponseIncidentSchema = z.object({
  incident: z.object({
    id: z.string(),
    custom_field_entries: z.array(
      z.object({
        custom_field: z.object({ id: z.string() }),
        values: z.array(CustomFieldValueSchema),
      })
    ),
  }),
})

function parseRetryAfterMs(header: string | null): number | undefined {
  if (!header) return undefined

  const seconds = Number(header)
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000

  const dateMs = Date.parse(header)
  if (!Number.isNaN(dateMs)) return Math.max(0, dateMs - Date.now())

  return undefined
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function backoffWithJitter(attempt: number): number {
  const base = 1000 * 2 ** attempt
  return base / 2 + Math.random() * (base / 2)
}

// Shared by all three incident.io calls: on a 429, wait for the Retry-After hint (or an
// exponential fallback) and retry, up to MAX_RETRIES times, then return the still-429 response
// to the caller.
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) })

    if (response.status !== 429 || attempt >= MAX_RETRIES) {
      return response
    }

    const retryAfterMs = parseRetryAfterMs(response.headers.get('Retry-After'))
    await sleep(Math.max(retryAfterMs ?? 0, backoffWithJitter(attempt)))
  }
}

async function fetchWidget(url: string): Promise<WidgetResponse> {
  const response = await fetchWithRetry(url, { cache: 'no-store' }, WIDGET_TIMEOUT_MS)

  if (!response.ok) {
    const retryAfter = response.headers.get('Retry-After') ?? undefined
    const body = await response.text()
    throw new InternalServerError(`incident.io Widget API responded with ${response.status}`, {
      status: response.status,
      body,
      ...(retryAfter !== undefined && { retryAfter }),
    })
  }

  const json = await response.json()
  const result = WidgetResponseSchema.safeParse(json)
  if (!result.success) {
    throw new InternalServerError('incident.io Widget API response did not match expected schema', {
      issues: result.error.issues,
    })
  }

  return result.data
}

async function fetchLinkedResponseIncidentIds(
  apiKey: string,
  statusPageId: string,
  itemId: string
): Promise<Array<string>> {
  const response = await fetchWithRetry(
    `https://api.incident.io/v1/status-pages/${statusPageId}/incidents/${itemId}/response-incidents`,
    { headers: { Authorization: `Bearer ${apiKey}` } },
    LINK_TIMEOUT_MS
  )

  if (response.status === 404) return []

  if (!response.ok) {
    throw new Error(`incident.io response-incidents lookup responded with ${response.status}`)
  }

  const json = await response.json()
  const result = LinkedResponseIncidentsSchema.parse(json)
  return result.incidents.map((incident) => incident.id)
}

async function fetchResponseIncident(apiKey: string, id: string): Promise<ResponseIncident> {
  const response = await fetchWithRetry(
    `https://api.incident.io/v2/incidents/${id}`,
    { headers: { Authorization: `Bearer ${apiKey}` } },
    INCIDENT_TIMEOUT_MS
  )

  if (!response.ok) {
    throw new Error(`incident.io incident lookup responded with ${response.status}`)
  }

  const json = await response.json()
  return ResponseIncidentSchema.parse(json).incident
}

export async function getStatusPage(): Promise<StatusPageResult> {
  const widgetUrl = process.env.INCIDENT_IO_WIDGET_URL
  if (!widgetUrl) {
    throw new InternalServerError('INCIDENT_IO_WIDGET_URL is not set')
  }

  const widget = await fetchWidget(widgetUrl)

  const modeFieldIds = customContentRaw['status_page:visibility_field_ids'] ?? ['']

  const apiKey = process.env.INCIDENT_IO_API_KEY
  const statusPageId = process.env.INCIDENT_IO_STATUS_PAGE_ID

  if (!apiKey || !statusPageId) {
    console.error('INCIDENT_IO_API_KEY or INCIDENT_IO_STATUS_PAGE_ID is not set')
    return { data: annotateWidget(widget, new Map(), modeFieldIds), isDegraded: true }
  }

  let isDegraded = false

  const allItems = [
    ...widget.ongoing_incidents,
    ...widget.in_progress_maintenances,
    ...widget.scheduled_maintenances,
  ]

  const linkResults = await Promise.allSettled(
    allItems.map((item) => fetchLinkedResponseIncidentIds(apiKey, statusPageId, item.id))
  )

  const linkedIdsByItemId = new Map<string, Array<string>>()
  linkResults.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      linkedIdsByItemId.set(allItems[index].id, result.value)
    } else {
      isDegraded = true
    }
  })

  const uniqueLinkedIds = Array.from(new Set(Array.from(linkedIdsByItemId.values()).flat()))

  const incidentResults = await Promise.allSettled(
    uniqueLinkedIds.map((id) => fetchResponseIncident(apiKey, id))
  )

  const incidentsById = new Map<string, ResponseIncident>()
  incidentResults.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      incidentsById.set(uniqueLinkedIds[index], result.value)
    } else {
      isDegraded = true
    }
  })

  const flagsById = new Map<string, ResponseIncidentFlags>()
  for (const item of allItems) {
    const linkedIncidents = (linkedIdsByItemId.get(item.id) ?? [])
      .map((id) => incidentsById.get(id))
      .filter((incident): incident is ResponseIncident => incident !== undefined)

    if (linkedIncidents.length > 0) {
      flagsById.set(
        item.id,
        mergeLinkedFlags(linkedIncidents, modeFieldIds, {
          hideBannerFieldId: HIDE_BANNER_FIELD_ID,
          leadDaysFieldId: BANNER_LEAD_DAYS_FIELD_ID,
        })
      )
    }
  }

  return { data: annotateWidget(widget, flagsById, modeFieldIds), isDegraded }
}
