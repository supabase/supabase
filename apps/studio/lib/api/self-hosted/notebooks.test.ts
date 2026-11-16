import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  deleteNotebook,
  getNotebook,
  isNotebookPayload,
  listNotebooks,
  saveNotebook,
} from './notebooks'

const ID = '0b0e2c55-3a43-4f2f-9a31-5f8b8d9e7a10'

const payload = {
  id: ID,
  name: 'RLS Disabled in Public: public.orders',
  description: 'From an alert issue',
  type: 'notebook',
  visibility: 'project',
  content: {
    schema_version: 1,
    cells: [
      { _tag: 'markdown_cell', text: '# RLS Disabled in Public' },
      {
        _tag: 'database_cell',
        title: 'Exposed rows',
        sql: 'select count(*) from "public"."orders";',
        row_limit: 100,
      },
    ],
  },
}

describe('self-hosted notebooks', () => {
  let dir: string

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'notebooks-'))
  })

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true })
  })

  it('recognizes notebook payloads', () => {
    expect(isNotebookPayload(payload)).toBe(true)
    expect(isNotebookPayload({ ...payload, type: 'sql' })).toBe(false)
  })

  it('saves a notebook and assigns ids to new cells', async () => {
    const saved = await saveNotebook(payload, dir)

    expect(saved).toMatchObject({ id: ID, type: 'notebook', visibility: 'project' })
    expect(saved.content.cells).toHaveLength(2)
    for (const cell of saved.content.cells) expect(cell._id).toEqual(expect.any(String))

    expect(await getNotebook(ID, dir)).toEqual(saved)
  })

  it('keeps existing cell ids and the creation time on update', async () => {
    const first = await saveNotebook(payload, dir)
    const keptId = first.content.cells[0]._id

    const second = await saveNotebook(
      {
        ...payload,
        name: 'Renamed',
        content: { schema_version: 1, cells: [{ ...first.content.cells[0] }] },
      },
      dir
    )

    expect(second.name).toBe('Renamed')
    expect(second.inserted_at).toBe(first.inserted_at)
    expect(second.content.cells.map((cell) => cell._id)).toEqual([keptId])
  })

  it('rejects an invalid notebook', async () => {
    await expect(saveNotebook({ ...payload, id: 'not-a-uuid' }, dir)).rejects.toThrow()
  })

  it('returns null for an unknown notebook', async () => {
    expect(await getNotebook(ID, dir)).toBeNull()
    expect(await getNotebook('../../etc/passwd', dir)).toBeNull()
  })

  it('lists notebooks newest first, filtered by name', async () => {
    await saveNotebook(payload, dir)
    await saveNotebook(
      { ...payload, id: '9c1d6b3e-1f0a-4c55-8f4e-2b6a7d1c0e99', name: 'Slow queries' },
      dir
    )

    expect((await listNotebooks({}, dir)).map((notebook) => notebook.name)).toEqual([
      'Slow queries',
      'RLS Disabled in Public: public.orders',
    ])
    expect((await listNotebooks({ name: 'slow' }, dir)).map((n) => n.name)).toEqual([
      'Slow queries',
    ])
  })

  it('lists nothing when no notebook was saved', async () => {
    expect(await listNotebooks({}, path.join(dir, 'missing'))).toEqual([])
  })

  it('deletes a notebook', async () => {
    await saveNotebook(payload, dir)

    expect(await deleteNotebook(ID, dir)).toBe(true)
    expect(await getNotebook(ID, dir)).toBeNull()
    expect(await deleteNotebook(ID, dir)).toBe(false)
  })
})
