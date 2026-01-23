import 'server-only'

export const getTitlePropertyName = async (dbId: string, apiKey: string): Promise<string> => {
  const resp = await fetch(`https://api.notion.com/v1/databases/${dbId}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Notion-Version': '2022-06-28',
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
      'Notion-Version': '2022-06-28',
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
