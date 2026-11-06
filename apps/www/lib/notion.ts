import 'server-only'

const NOTION_VERSION = '2022-06-28'

/**
 * Query a Notion database with optional filter and sorts.
 * Returns the raw array of page objects from the Notion API.
 * Paginates automatically to fetch all matching results.
 */
export const queryDatabase = async (
  dbId: string,
  apiKey: string,
  filter?: Record<string, unknown>,
  sorts?: Array<Record<string, unknown>>
): Promise<any[]> => {
  const pages: any[] = []
  let cursor: string | undefined

  do {
    const body: Record<string, unknown> = {}
    if (filter) body.filter = filter
    if (sorts) body.sorts = sorts
    if (cursor) body.start_cursor = cursor

    const resp = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      next: { revalidate: 300 }, // cache for 5 minutes
    })

    if (!resp.ok) {
      const text = await resp.text()
      throw new Error(`Failed to query Notion database: ${text}`)
    }

    const data = await resp.json()
    pages.push(...data.results)
    cursor = data.has_more ? data.next_cursor : undefined
  } while (cursor)

  return pages
}

export const getTitlePropertyName = async (dbId: string, apiKey: string): Promise<string> => {
  const resp = await fetch(`https://api.notion.com/v1/databases/${dbId}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Notion-Version': NOTION_VERSION,
    },
  })
  if (!resp.ok) throw new Error('Failed to retrieve database metadata')
  const db: any = await resp.json()
  const entry = Object.entries(db.properties).find(([, v]: any) => v?.type === 'title')
  if (!entry) throw new Error('No title property found in notion database')
  return entry[0]
}

export const insertPageInDatabase = async (
  dbId: string,
  apiKey: string,
  data: any
): Promise<string> => {
  const resp = await fetch(`https://api.notion.com/v1/pages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      parent: { database_id: dbId },
      properties: data,
    }),
  })
  if (!resp.ok) {
    const respText = await resp.text()
    throw new Error('Failed to insert page into notion database: ' + respText)
  }

  const json = await resp.json()
  return json.id
}
