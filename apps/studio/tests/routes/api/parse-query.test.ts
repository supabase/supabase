import { describe, expect, it } from 'vitest'

import { Route } from '@/routes/api/parse-query'
import { callRoute } from '@/tests/lib/server-route'

const parseQuery = (body: string) =>
  callRoute(
    Route,
    new Request('http://localhost/api/parse-query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })
  )

describe('/api/parse-query', () => {
  it('parses a SQL query and extracts tables, operation, and where clause', async () => {
    const response = await parseQuery(
      JSON.stringify({ sql: 'SELECT * FROM public.users WHERE id = 1;' })
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      tables: ['public.users'],
      operation: 'SELECT',
      whereClause: 'id = 1',
      statementCount: 1,
    })
  })

  it.each([
    ['sql is missing', '{}'],
    ['body is JSON null', 'null'],
  ])('returns 400 when %s', async (_, body) => {
    const response = await parseQuery(body)

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Missing or invalid "sql" in request body' })
  })
})
