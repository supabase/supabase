import 'server-only'

const NOTION_API_BASE = 'https://api.notion.com/v1'
const NOTION_VERSION = '2022-06-28'

export interface NotionConfig {
  apiKey: string
}

interface NotionDatabaseProperty {
  id: string
  name: string
  type: string
}

interface NotionDatabaseSchema {
  properties: Record<string, NotionDatabaseProperty>
}

export class NotionClient {
  private apiKey: string
  private schemaCache = new Map<string, Promise<NotionDatabaseSchema>>()

  constructor(config: NotionConfig) {
    if (!config.apiKey) throw new Error('NotionClient: apiKey is required')
    this.apiKey = config.apiKey
  }

  private async request<T>(path: string, method: 'GET' | 'POST', body?: unknown): Promise<T> {
    const response = await fetch(`${NOTION_API_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Notion API request failed: ${response.status} - ${errorText}`)
    }

    return (await response.json()) as T
  }

  private getSchema(databaseId: string): Promise<NotionDatabaseSchema> {
    let pending = this.schemaCache.get(databaseId)
    if (!pending) {
      // databaseId is validated at the schema layer, but encodeURIComponent
      // keeps this safe as defense-in-depth if the client ever grows a caller
      // that bypasses the zod boundary.
      pending = this.request<NotionDatabaseSchema>(
        `/databases/${encodeURIComponent(databaseId)}`,
        'GET'
      )
      this.schemaCache.set(databaseId, pending)
    }
    return pending
  }

  /**
   * Create a page in the given database. Property types are auto-detected from
   * the database schema, so values can be passed as plain strings/numbers and
   * will be wrapped in the correct Notion property shape.
   * Unknown columns (not present in the database) are silently skipped.
   *
   * If the database has an `email`-typed column and `values` includes a value
   * for it, the database is first queried for an existing row with that email.
   * If one exists, the call is a no-op (skip-on-duplicate). Notion has no
   * native dedupe, so this is the only thing standing between us and a row
   * for every refresh of the form.
   */
  async createDatabasePage(databaseId: string, values: Record<string, unknown>): Promise<void> {
    const schema = await this.getSchema(databaseId)
    const properties: Record<string, unknown> = {}

    for (const [name, value] of Object.entries(values)) {
      if (value === undefined || value === null || value === '') continue
      const schemaProp = schema.properties[name]
      if (!schemaProp) continue
      const encoded = encodePropertyValue(schemaProp.type, value)
      if (encoded !== undefined) properties[name] = encoded
    }

    const emailColumn = Object.values(schema.properties).find((p) => p.type === 'email')
    if (emailColumn) {
      const incomingEmail = values[emailColumn.name]
      if (typeof incomingEmail === 'string' && incomingEmail.trim() !== '') {
        const exists = await this.pageExistsByEmail(
          databaseId,
          emailColumn.name,
          incomingEmail.trim()
        )
        if (exists) {
          console.warn('[crm/notion] Skipping duplicate submission', {
            databaseId,
            emailColumn: emailColumn.name,
          })
          return
        }
      }
    }

    await this.request('/pages', 'POST', {
      parent: { database_id: databaseId },
      properties,
    })
  }

  private async pageExistsByEmail(
    databaseId: string,
    propertyName: string,
    email: string
  ): Promise<boolean> {
    const result = await this.request<{ results: unknown[] }>(
      `/databases/${encodeURIComponent(databaseId)}/query`,
      'POST',
      {
        filter: {
          property: propertyName,
          email: { equals: email },
        },
        page_size: 1,
      }
    )
    return result.results.length > 0
  }
}

/** Notion rejects rich text objects whose content is longer than 2,000 characters. */
const NOTION_RICH_TEXT_MAX_LENGTH = 2000

/** Splits a string across as many rich text objects as needed to stay under Notion's limit. */
function toRichText(str: string): Array<{ text: { content: string } }> {
  const chunks: Array<{ text: { content: string } }> = []
  let content = ''
  // Iterate by code point so a chunk boundary never splits a surrogate pair.
  for (const char of str) {
    if (content.length + char.length > NOTION_RICH_TEXT_MAX_LENGTH) {
      chunks.push({ text: { content } })
      content = ''
    }
    content += char
  }
  if (content) chunks.push({ text: { content } })
  return chunks
}

function encodePropertyValue(type: string, value: unknown): unknown {
  const str = typeof value === 'string' ? value : String(value)

  switch (type) {
    case 'title':
      return { title: toRichText(str) }
    case 'rich_text':
      return { rich_text: toRichText(str) }
    case 'email':
      return { email: str }
    case 'phone_number':
      return { phone_number: str }
    case 'url':
      return { url: str }
    case 'number': {
      const n = typeof value === 'number' ? value : Number(str)
      return Number.isFinite(n) ? { number: n } : undefined
    }
    case 'checkbox': {
      const b = typeof value === 'boolean' ? value : str === 'true' || str === 'on'
      return { checkbox: b }
    }
    case 'date':
      return { date: { start: str } }
    case 'select':
      return { select: { name: str } }
    case 'multi_select':
      return {
        multi_select: str
          .split(',')
          .map((s) => ({ name: s.trim() }))
          .filter((o) => o.name),
      }
    default:
      return { rich_text: toRichText(str) }
  }
}
