import type { ResourceCandidate, ResourceExtractor } from './types'

interface KnownConfigSection {
  displayOrder: number
  iconKey: string
  connectsToDatabase: boolean
}

/**
 * Top-level Supabase config sections we know how to render. Anything not in
 * this map still gets a node — it just sorts after known sections and uses the
 * generic `config` icon.
 */
const KNOWN_CONFIG_SECTIONS: Record<string, KnownConfigSection> = {
  db: { displayOrder: 0, iconKey: 'db', connectsToDatabase: true },
  api: { displayOrder: 1, iconKey: 'api', connectsToDatabase: true },
  auth: { displayOrder: 2, iconKey: 'auth', connectsToDatabase: true },
  storage: { displayOrder: 3, iconKey: 'storage', connectsToDatabase: true },
  edge_runtime: { displayOrder: 4, iconKey: 'edge_runtime', connectsToDatabase: false },
  realtime: { displayOrder: 5, iconKey: 'realtime', connectsToDatabase: true },
  vault: { displayOrder: 6, iconKey: 'vault', connectsToDatabase: true },
}

const UNKNOWN_CONFIG_DISPLAY_ORDER = 100
const SCHEMA_DISPLAY_ORDER = 200

export const extractConfig: ResourceExtractor = ({ path, content, templateId }) => {
  const sections = new Set<string>()
  const schemas = new Set<string>()

  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    const sectionMatch = trimmed.match(/^\[([^\].]+)(?:\.[^\]]+)?\]$/)
    if (sectionMatch) sections.add(sectionMatch[1])

    const schemasMatch = trimmed.match(/^schemas\s*=\s*\[([^\]]*)\]$/)
    if (schemasMatch) {
      for (const schema of schemasMatch[1].match(/"([^"]+)"/g) ?? []) {
        schemas.add(schema.replaceAll('"', ''))
      }
    }
  }

  if (sections.has('db')) schemas.add('public')

  const configResources: ResourceCandidate[] = Array.from(sections).map((section) => {
    const known = KNOWN_CONFIG_SECTIONS[section]
    return {
      id: `config:${section}`,
      kind: 'config',
      label: section,
      sourceFilePath: path,
      sourceTemplateId: templateId,
      iconKey: known?.iconKey ?? 'config',
      displayOrder: known?.displayOrder ?? UNKNOWN_CONFIG_DISPLAY_ORDER,
      connectsToDatabase: known?.connectsToDatabase ?? false,
    }
  })

  const schemaResources: ResourceCandidate[] = Array.from(schemas).map((schema) => ({
    id: `schema:${schema}`,
    kind: 'schema',
    label: schema,
    sourceFilePath: path,
    sourceTemplateId: templateId,
    iconKey: 'schema',
    displayOrder: SCHEMA_DISPLAY_ORDER,
    connectsToDatabase: true,
  }))

  return [...configResources, ...schemaResources]
}
