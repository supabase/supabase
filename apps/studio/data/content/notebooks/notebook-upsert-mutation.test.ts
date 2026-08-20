import { safeSql } from '@supabase/pg-meta'
import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import type { WritableNotebook } from './notebook-schema'
import { upsertNotebook } from './notebook-upsert-mutation'
import { safeSql as safeLogSql } from '@/data/logs/safe-analytics-sql'
import { addAPIMock } from '@/tests/lib/msw'

const DATABASE_SQL = safeSql`select * from auth.users limit 100`
const LOG_SQL = "select timestamp, event_message from edge_logs where source = 'edge_logs' limit 10"

const EXISTING_CELL_ID = 'b1ffcd88-8d1a-4de7-aa5c-5aa8ac270b22'

// Update-shaped: mixes an existing cell (kept, carries its real backend-assigned _id so the
// backend can diff it against the previous version) with a newly inserted cell (no id —
// same as create, the backend assigns one on write).
const UPDATE_CONTENT: WritableNotebook = {
  schema_version: 1,
  cells: [
    {
      _tag: 'database_cell',
      _id: EXISTING_CELL_ID,
      sql: DATABASE_SQL,
      row_limit: 100,
    },
    {
      _tag: 'log_cell',
      sql: safeLogSql`select timestamp, event_message from edge_logs where source = 'edge_logs' limit 10`,
      time_range: { _tag: 'relative_time_range', unit: 'hour', amount: 1 },
    },
  ],
}

// Missing `row_limit` on the database_cell — invalid per writableNotebookSchema. The
// point of this fixture is to prove validation runs (and rejects) before any request is
// sent, so it's cast rather than satisfying the real type.
const INVALID_CONTENT = {
  schema_version: 1,
  cells: [
    {
      _tag: 'database_cell',
      sql: safeSql`select 1`,
    },
  ],
} as unknown as WritableNotebook

describe('upsertNotebook', () => {
  const NOTEBOOK_ID = 'd3aadd77-7c3c-4de7-aa5c-5aa8ac270b44'

  it('PUTs with the given id, keeping the existing cell id and leaving the new cell without one', async () => {
    let sentBody: Record<string, unknown> | undefined
    addAPIMock({
      method: 'put',
      path: '/platform/projects/:ref/content',
      response: async ({ request }) => {
        sentBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(null)
      },
    })

    await upsertNotebook({
      projectRef: 'default',
      id: NOTEBOOK_ID,
      name: 'Signup funnel',
      content: UPDATE_CONTENT,
    })

    expect(sentBody?.id).toBe(NOTEBOOK_ID)
    expect(sentBody?.type).toBe('notebook')

    const content = sentBody?.content as WritableNotebook
    const [databaseCell, logCell] = content.cells as Array<Record<string, unknown>>
    expect(databaseCell._id).toBe(EXISTING_CELL_ID)
    expect(databaseCell).not.toHaveProperty('id')
    expect(databaseCell.sql).toBe(DATABASE_SQL)
    expect(logCell).not.toHaveProperty('id')
    expect(logCell).not.toHaveProperty('_id')
    expect(logCell.sql).toBe(LOG_SQL)
  })

  it('rejects malformed content without making a network request', async () => {
    await expect(
      upsertNotebook({
        projectRef: 'default',
        id: NOTEBOOK_ID,
        name: 'Bad notebook',
        content: INVALID_CONTENT,
      })
    ).rejects.toThrow()
  })
})
