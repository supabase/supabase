import { safeSql } from '@supabase/pg-meta'
import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import type { WritableNotebook } from './notebook-schema'
import { createNotebook, updateNotebook } from './notebook-upsert-mutation'
import { safeSql as safeLogSql } from '@/data/logs/safe-analytics-sql'
import { addAPIMock } from '@/tests/lib/msw'

const DATABASE_SQL = safeSql`select * from auth.users limit 100`
const LOG_SQL = "select timestamp, event_message from edge_logs where source = 'edge_logs' limit 10"

const EXISTING_CELL_ID = 'b1ffcd88-8d1a-4de7-aa5c-5aa8ac270b22'

// Create-shaped: no cell carries an `id` — the notebook is brand new, so no cell has a
// prior version for the backend to diff against; ids are backend-generated on write.
const VALID_CONTENT: WritableNotebook = {
  schema_version: 1,
  cells: [
    { _tag: 'markdown_cell', text: '# Signup funnel' },
    { _tag: 'database_cell', sql: DATABASE_SQL, row_limit: 100 },
    {
      _tag: 'log_cell',
      sql: safeLogSql`select timestamp, event_message from edge_logs where source = 'edge_logs' limit 10`,
      time_range: { _tag: 'relative_time_range', unit: 'hour', amount: 1 },
    },
  ],
}

// Update-shaped: mixes an existing cell (kept, carries its real backend-assigned id so the
// backend can diff it against the previous version) with a newly inserted cell (no id —
// same as create, the backend assigns one on write).
const UPDATE_CONTENT: WritableNotebook = {
  schema_version: 1,
  cells: [
    {
      _tag: 'database_cell',
      id: EXISTING_CELL_ID,
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

describe('createNotebook', () => {
  it('PUTs with type notebook, visibility project, a freshly generated id, and cells with no id', async () => {
    let sentBody: Record<string, unknown> | undefined
    addAPIMock({
      method: 'put',
      path: '/platform/projects/:ref/content',
      response: async ({ request }) => {
        sentBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(null)
      },
    })

    await createNotebook({
      projectRef: 'default',
      name: 'Signup funnel',
      content: VALID_CONTENT,
    })

    expect(sentBody?.type).toBe('notebook')
    expect(sentBody?.visibility).toBe('project')
    expect(typeof sentBody?.id).toBe('string')

    const content = sentBody?.content as WritableNotebook
    for (const cell of content.cells) {
      expect(cell).not.toHaveProperty('id')
    }

    const [, databaseCell, logCell] = content.cells as Array<Record<string, unknown>>
    expect(databaseCell.sql).toBe(DATABASE_SQL)
    expect(logCell.sql).toBe(LOG_SQL)
  })

  it('rejects malformed content without making a network request', async () => {
    await expect(
      createNotebook({ projectRef: 'default', name: 'Bad notebook', content: INVALID_CONTENT })
    ).rejects.toThrow()
  })
})

describe('updateNotebook', () => {
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

    await updateNotebook({
      projectRef: 'default',
      id: NOTEBOOK_ID,
      name: 'Signup funnel',
      content: UPDATE_CONTENT,
    })

    expect(sentBody?.id).toBe(NOTEBOOK_ID)
    expect(sentBody?.type).toBe('notebook')

    const content = sentBody?.content as WritableNotebook
    const [databaseCell, logCell] = content.cells as Array<Record<string, unknown>>
    expect(databaseCell.id).toBe(EXISTING_CELL_ID)
    expect(databaseCell.sql).toBe(DATABASE_SQL)
    expect(logCell).not.toHaveProperty('id')
    expect(logCell.sql).toBe(LOG_SQL)
  })

  it('rejects malformed content without making a network request', async () => {
    await expect(
      updateNotebook({
        projectRef: 'default',
        id: NOTEBOOK_ID,
        name: 'Bad notebook',
        content: INVALID_CONTENT,
      })
    ).rejects.toThrow()
  })
})
