export type AttributeSectionId =
  | 'details'
  | 'request'
  | 'response'
  | 'auth'
  | 'client'
  | 'postgres'
  | 'event'
  | 'request-headers'
  | 'response-headers'
  | 'other'

export interface AttributeSection {
  id: AttributeSectionId
  title: string
  fields: { key: string; label: string; value: unknown }[]
}

// First matching prefix wins, so the more specific prefixes come first. The
// prefix is dropped from the label (`request.cf.city` → `city`).
const PREFIX_RULES: { prefixes: string[]; section: AttributeSectionId }[] = [
  { prefixes: ['request.headers.', 'req.headers.'], section: 'request-headers' },
  { prefixes: ['response.headers.', 'res.headers.'], section: 'response-headers' },
  { prefixes: ['request.cf.'], section: 'client' },
  { prefixes: ['request.sb.'], section: 'auth' },
  { prefixes: ['request.', 'req.'], section: 'request' },
  { prefixes: ['response.', 'res.'], section: 'response' },
  { prefixes: ['parsed.'], section: 'postgres' },
  { prefixes: ['auth_event.', 'auth_audit_event.'], section: 'event' },
]

// Listed in display order
const SECTION_TITLES: Record<AttributeSectionId, string> = {
  details: 'Details',
  request: 'Request',
  response: 'Response',
  auth: 'Authorization',
  client: 'Client',
  postgres: 'Postgres',
  event: 'Event',
  'request-headers': 'Request headers',
  'response-headers': 'Response headers',
  other: 'Other',
}

const isEmpty = (value: unknown) => value === null || value === undefined || value === ''

function classify(key: string): { section: AttributeSectionId; label: string } {
  for (const { prefixes, section } of PREFIX_RULES) {
    const prefix = prefixes.find((p) => key.startsWith(p))
    if (prefix) return { section, label: key.slice(prefix.length) }
  }
  // Top-level keys (e.g. `msg`, `execution_id`) describe the log itself
  if (!key.includes('.')) return { section: 'details', label: key }
  return { section: 'other', label: key }
}

/**
 * Groups a log's attributes into sections by key prefix, so any source reads
 * the same way without a hand-written layout. Empty values are dropped.
 */
export function groupLogAttributes(attributes: Record<string, unknown>): AttributeSection[] {
  const fieldsBySection = new Map<AttributeSectionId, AttributeSection['fields']>()

  for (const key of Object.keys(attributes).sort()) {
    const value = attributes[key]
    if (isEmpty(value)) continue
    const { section, label } = classify(key)
    const fields = fieldsBySection.get(section) ?? []
    fields.push({ key, label, value })
    fieldsBySection.set(section, fields)
  }

  return (Object.keys(SECTION_TITLES) as AttributeSectionId[])
    .filter((id) => fieldsBySection.has(id))
    .map((id) => ({ id, title: SECTION_TITLES[id], fields: fieldsBySection.get(id) ?? [] }))
}
