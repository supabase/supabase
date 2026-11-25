import { describe, expect, it } from 'vitest'

import { Route } from '@/routes/api/parse-query'
import { getRouteHandler } from '@/tests/lib/server-route'

describe('/api/parse-query', () => {
  it('parses a SQL query and extracts tables, operation, and where clause', async () => {
    const response = await getRouteHandler(
      Route,
      'POST'
    )({
      request: new Request('http://localhost/api/parse-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: 'SELECT * FROM public.users WHERE id = 1;' }),
      }),
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      tables: ['public.users'],
      operation: 'SELECT',
      whereClause: 'id = 1',
      statementCount: 1,
    })
  })

  it('returns 400 when sql is missing', async () => {
    const response = await getRouteHandler(
      Route,
      'POST'
    )({
      request: new Request('http://localhost/api/parse-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Missing or invalid "sql" in request body' })
  })

  it('returns 400 when body is JSON null', async () => {
    const response = await getRouteHandler(
      Route,
      'POST'
    )({
      request: new Request('http://localhost/api/parse-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'null',
      }),
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Missing or invalid "sql" in request body' })
  })

  it('returns 400 on malformed JSON', async () => {
    const response = await getRouteHandler(
      Route,
      'POST'
    )({
      request: new Request('http://localhost/api/parse-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{',
      }),
    })

    expect(response.status).toBe(400)
  })

  it('returns 405 with Allow: POST for unsupported methods', async () => {
    const response = await getRouteHandler(
      Route,
      'GET'
    )({
      request: new Request('http://localhost/api/parse-query', { method: 'GET' }),
    })

    expect(response.status).toBe(405)
    expect(response.headers.get('Allow')).toBe('POST')
  })
})
