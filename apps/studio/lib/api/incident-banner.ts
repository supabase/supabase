import { createHash } from 'crypto'
import { IS_PROD } from 'common'
import z from 'zod'

import { InternalServerError } from '@/lib/api/apiHelpers'

const INCIDENT_IO_BASE_URL = 'https://api.incident.io/v2'

const BANNER_FIELD_ID = '01KKCFNW31EGRMD3JQ58E2TJ2M'
const METADATA_FIELD_ID = '01KKCD4KNWQ7HYSXT72CHB7WR4'

const MINOR_SEVERITY_ID = '01J7BTA8DEF371JQSXGBZYZY7D'

const SENTINEL_VALUE_SHOW_BANNER = '1'
const SENTINEL_VALUE_FORCE_BANNER = '100'

const FALLBACK_METADATA = { affected_regions: null, affects_project_creation: false }

const MetadataSchema = z.object({
  affected_regions: z.union([z.array(z.string()), z.null()]),
  affects_project_creation: z.boolean(),
})

interface CustomFieldValue {
  value_option?: { id: string; value: string }
  value_text?: string
  value_numeric?: string
}

interface CustomFieldEntry {
  custom_field: { id: string }
  values: Array<CustomFieldValue>
}

interface Incident {
  id: string
  name: string
  mode: string
  created_at: string
  custom_field_entries: Array<CustomFieldEntry>
}

interface IncidentIoListResponse {
  incidents: Array<Incident>
  pagination_meta?: { after?: string }
}

export type ShowBannerValue = true | 'force'

export interface BannerIncident {
  id: string
  show_banner: ShowBannerValue
  metadata: z.infer<typeof MetadataSchema> & { force: boolean }
}

function getFieldValue(entries: Array<CustomFieldEntry>, fieldId: string): string | undefined {
  const entry = entries.find((e) => e.custom_field.id === fieldId)
  if (!entry || entry.values.length === 0) return undefined
  const val = entry.values[0]
  return val.value_option?.value ?? val.value_text ?? val.value_numeric
}

async function fetchAllIncidents(apiKey: string, mode: string): Promise<Array<Incident>> {
  const incidents: Array<Incident> = []
  let after: string | undefined

  do {
    const params = new URLSearchParams()
    params.append('status_category[one_of]', 'live')
    params.append('severity[gte]', MINOR_SEVERITY_ID)
    params.append('mode[one_of]', mode)
    params.set('page_size', '25')
    if (after) params.set('after', after)

    const response = await fetch(`${INCIDENT_IO_BASE_URL}/incidents?${params}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 180 },
      signal: AbortSignal.timeout(30_000),
    })

    if (!response.ok) {
      const retryAfter = response.headers.get('Retry-After') ?? undefined
      const body = await response.text()
      throw new InternalServerError(`incident.io API responded with ${response.status}`, {
        status: response.status,
        body,
        ...(retryAfter !== undefined && { retryAfter }),
      })
    }

    const data: IncidentIoListResponse = await response.json()
    incidents.push(...data.incidents)
    after = data.pagination_meta?.after
  } while (after)

  return incidents
}

/**
 * Fetches active banner incidents from the incident.io API.
 *
 * @returns Array of banner incidents
 * @throws Error if INCIDENT_IO_API_KEY is not set or the API returns an error
 */
export async function getBannerIncidents(): Promise<Array<BannerIncident>> {
  const apiKey = process.env.INCIDENT_IO_API_KEY
  if (!apiKey) {
    throw new Error('INCIDENT_IO_API_KEY is not set')
  }

  const incidentMode = IS_PROD ? 'standard' : 'test'
  const allIncidents = await fetchAllIncidents(apiKey, incidentMode)

  const bannerIncidents: Array<BannerIncident> = []

  for (const incident of allIncidents) {
    const bannerValue = getFieldValue(incident.custom_field_entries, BANNER_FIELD_ID)
    if (bannerValue !== SENTINEL_VALUE_SHOW_BANNER && bannerValue !== SENTINEL_VALUE_FORCE_BANNER) {
      continue
    }

    const metadataRaw = getFieldValue(incident.custom_field_entries, METADATA_FIELD_ID)

    let parsedJson: unknown = null
    try {
      parsedJson = JSON.parse(metadataRaw ?? 'null')
    } catch {
      // malformed JSON — fall through to default metadata
    }
    const parsed = MetadataSchema.safeParse(parsedJson)
    const metadata: z.infer<typeof MetadataSchema> = parsed.success
      ? parsed.data
      : FALLBACK_METADATA

    bannerIncidents.push({
      id: createHash('sha256').update(incident.created_at).digest('hex'),
      show_banner: bannerValue === SENTINEL_VALUE_FORCE_BANNER ? 'force' : true,
      metadata: { ...metadata, force: bannerValue === SENTINEL_VALUE_FORCE_BANNER },
    })
  }

  return bannerIncidents
}
