import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  deleteSnippet,
  getSnippet,
  getSnippets,
  saveSnippet,
  SnippetSchema,
  updateSnippet,
} from './snippets.utils'

const config = vi.hoisted(() => ({ snippetsDir: '' }))

vi.mock('./snippets.constants', () => ({
  get SNIPPETS_DIR() {
    return config.snippetsDir
  },
}))

describe('snippet filename round trips', () => {
  beforeEach(async () => {
    config.snippetsDir = await fs.mkdtemp(path.join(os.tmpdir(), 'studio-snippets-'))
  })

  afterEach(async () => {
    await fs.rm(config.snippetsDir, { recursive: true, force: true })
  })

  it.each(['report', 'report.sql.backup', 'report.sql', 'report.sql.sql'])(
    'preserves the name and file when saving, updating, and deleting %s',
    async (name) => {
      const sql = 'select 1;'
      const saved = await saveSnippet(
        SnippetSchema.parse({
          id: randomUUID(),
          name,
          type: 'sql',
          visibility: 'user',
          content: { sql, content_id: randomUUID(), schema_version: '1.0' },
        })
      )

      expect(saved.name).toBe(name)
      expect(await fs.readdir(config.snippetsDir)).toEqual([`${name}.sql`])

      const { snippets } = await getSnippets()
      expect(snippets).toHaveLength(1)
      expect(snippets[0]).toMatchObject({ id: saved.id, name, content: { sql } })

      const metadata = await getSnippets({ includeContent: false })
      expect(metadata.snippets[0]).toMatchObject({ id: saved.id, name })

      const loaded = await getSnippet(saved.id)
      expect(loaded).toMatchObject({ id: saved.id, name, content: { sql } })

      const renamed = await updateSnippet(saved.id, { name: `${name}-renamed` })
      expect(renamed.name).toBe(`${name}-renamed`)
      expect(await fs.readdir(config.snippetsDir)).toEqual([`${name}-renamed.sql`])
      expect(await getSnippet(renamed.id)).toMatchObject({ content: { sql } })

      await deleteSnippet(renamed.id)
      expect(await fs.readdir(config.snippetsDir)).toEqual([])
    }
  )
})
