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

const SECTIONS: { id: AttributeSectionId; title: string }[] = [
  { id: 'details', title: 'Details' },
  { id: 'request', title: 'Request' },
  { id: 'response', title: 'Response' },
  { id: 'auth', title: 'Authorization' },
  { id: 'client', title: 'Client' },
  { id: 'postgres', title: 'Postgres' },
  { id: 'event', title: 'Event' },
  { id: 'request-headers', title: 'Request headers' },
  { id: 'response-headers', title: 'Response headers' },
  { id: 'other', title: 'Other' },
]

const isEmpty = (value: unknown) => value === null || value === undefined || value === ''

function classify(key: string): { section: AttributeSectionId; label: string } {
  for (const { prefixes, section } of PREFIX_RULES) {
    const prefix = prefixes.find((p) => key.startsWith(p))
    if (prefix) return { section, label: key.slice(prefix.length) }
  }

  if (!key.includes('.')) return { section: 'details', label: key }
  return { section: 'other', label: key }
}

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

  return SECTIONS.filter(({ id }) => fieldsBySection.has(id)).map((section) => ({
    ...section,
    fields: fieldsBySection.get(section.id) ?? [],
  }))
}
