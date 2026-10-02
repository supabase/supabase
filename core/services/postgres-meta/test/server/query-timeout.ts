import { expect, test, describe } from 'vitest'
import { app } from './utils'
import { pgMeta } from '../lib/utils'

const PG_QUERY_TIMEOUT = Number(process.env.PG_QUERY_TIMEOUT_SECS) ?? 10
const TIMEOUT = PG_QUERY_TIMEOUT + 2
const STATEMENT_TIMEOUT = PG_QUERY_TIMEOUT + 1
const CUSTOM_QUERY_TIMEOUT = 2

describe('test query timeout', () => {
  test(
    `pool timeout after ${TIMEOUT}s with statementTimeoutSecs and connection cleanup`,
    async () => {
      const query = `SELECT pg_sleep(${TIMEOUT + 10});`
      const res = await app.inject({
        method: 'POST',
        path: '/query',
        query: `statementTimeoutSecs=${STATEMENT_TIMEOUT}`,
        payload: {
          query,
        },
      })

      expect(res.statusCode).toBe(408)
      expect(res.json()).toMatchObject({
        error: expect.stringContaining('Query read timeout'),
      })
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const connectionsRes = await pgMeta.query(`
      SELECT * FROM pg_stat_activity where application_name = 'postgres-meta 0.0.0-automated' and query ILIKE '%${query}%';
    `)

      expect(connectionsRes.data).toHaveLength(0)
    },
    TIMEOUT * 1000
  )

  test(
    'absent queryTimeoutSecs uses default pool timeout',
    async () => {
      const query = `SELECT pg_sleep(${TIMEOUT + 10});`
      const res = await app.inject({
        method: 'POST',
        path: '/query',
        payload: {
          query,
        },
      })

      expect(res.statusCode).toBe(408)
      expect(res.json()).toMatchObject({
        error: expect.stringContaining('Query read timeout'),
      })
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // No statementTimeout was set, so the PG-side query is still running
      const connectionsRes = await pgMeta.query(`
      SELECT * FROM pg_stat_activity where application_name = 'postgres-meta 0.0.0-automated' and query ILIKE '%${query}%';
    `)

      expect(connectionsRes.data).toHaveLength(1)
    },
    TIMEOUT * 1000
  )

  test(
    'queryTimeoutSecs=0 disables pool-level timeout',
    async () => {
      const sleepSecs = PG_QUERY_TIMEOUT + 1
      const res = await app.inject({
        method: 'POST',
        path: '/query',
        query: 'queryTimeoutSecs=0',
        payload: {
          query: `SELECT pg_sleep(${sleepSecs});`,
        },
      })

      expect(res.statusCode).toBe(200)
      expect(res.json()).toEqual([{ pg_sleep: '' }])
    },
    (PG_QUERY_TIMEOUT + 5) * 1000
  )

  test(
    'custom queryTimeoutSecs overrides default pool timeout',
    async () => {
      const res = await app.inject({
        method: 'POST',
        path: '/query',
        query: `queryTimeoutSecs=${CUSTOM_QUERY_TIMEOUT}`,
        payload: {
          query: `SELECT pg_sleep(${PG_QUERY_TIMEOUT + 1});`,
        },
      })

      expect(res.statusCode).toBe(408)
      expect(res.json()).toMatchObject({
        error: expect.stringContaining('Query read timeout'),
      })
    },
    (CUSTOM_QUERY_TIMEOUT + 5) * 1000
  )

  test(
    'queryTimeoutSecs=0 with statementTimeoutSecs still enforces statement timeout',
    async () => {
      const res = await app.inject({
        method: 'POST',
        path: '/query',
        query: `queryTimeoutSecs=0&statementTimeoutSecs=${STATEMENT_TIMEOUT}`,
        payload: {
          query: `SELECT pg_sleep(${STATEMENT_TIMEOUT + 5});`,
        },
      })

      // Statement timeout fires (not pool timeout), producing a DatabaseError
      expect(res.statusCode).toBe(400)
      expect(res.json()).toMatchObject({
        error: expect.stringContaining('canceling statement due to statement timeout'),
      })
    },
    (STATEMENT_TIMEOUT + 5) * 1000
  )
})
