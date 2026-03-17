import { createHash } from 'crypto'
import { IS_PLATFORM, IS_PROD } from 'common'
import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

const INCIDENT_IO_BASE_URL = 'https://api.incident.io/v2'

const BANNER_FIELD_ID = '01KKCFNW31EGRMD3JQ58E2TJ2M'
const METADATA_FIELD_ID = '01KKCD4KNWQ7HYSXT72CHB7WR4'

const MINOR_SEVERITY_ID = '01J7BTA8DEF371JQSXGBZYZY7D'

const SENTINEL_VALUE_SHOW_BANNER = '1'
const SENTINEL_VALUE_FORCE_BANNER = '100'

const FALLBACK_METADATA = { affected_regions: null, affects_project_creation: false }

/**
 * Cache on browser for 5 minutes
 * Cache on CDN for 5 minutes
 * Allow serving stale content for 1 minute while revalidating
 */
const CACHE_CONTROL_SETTINGS = 'public, max-age=300, s-maxage=300, stale-while-revalidate=60'

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

type ShowBannerValue = true | 'force'

interface BannerIncident {
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
    })

    if (!response.ok) {
      const cause = await response.text()
      throw new Error(`incident.io API responded with status ${response.status}`, { cause })
    }

    const data: IncidentIoListResponse = await response.json()
    incidents.push(...data.incidents)
    after = data.pagination_meta?.after
  } while (after)

  return incidents
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!IS_PLATFORM) {
    return res.status(404).end()
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: { message: `Method ${req.method} Not Allowed` } })
  }

  const apiKey = process.env.INCIDENT_IO_API_KEY
  if (!apiKey) {
    console.error('INCIDENT_IO_API_KEY is not set')
    return res.status(500).json({ error: { message: 'Internal server error' } })
  }

  const incidentMode = IS_PROD ? 'standard' : 'test'

  let allIncidents: Array<Incident>
  try {
    allIncidents = await fetchAllIncidents(apiKey, incidentMode)
  } catch (error) {
    console.error('Error fetching incidents from incident.io: %O', error)
    return res.status(502).json({ error: { message: 'Internal server error' } })
  }

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

  res.setHeader('Cache-Control', CACHE_CONTROL_SETTINGS)
  return res.status(200).json({ incidents: bannerIncidents })
}

export default handler
