import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { generateDeterministicUuid } from './snippets.browser'
import { createFolder, getSnippet, updateSnippet } from './snippets.utils'

const directory = vi.hoisted(() => ({ path: '' }))

vi.mock('./snippets.constants', () => ({
  get SNIPPETS_DIR() {
    return directory.path
  },
}))

describe('updating filesystem snippets', () => {
  const originalSql = 'select 42;'
  const originalId = generateDeterministicUuid(['original.sql'])
  const originalPath = () => path.join(directory.path, 'original.sql')

  beforeEach(async () => {
    directory.path = await fs.mkdtemp(path.join(os.tmpdir(), 'studio-snippet-update-'))
    await fs.writeFile(originalPath(), originalSql)
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    await fs.rm(directory.path, { recursive: true, force: true })
  })

  it.each(['../invalid', 'invalid\0name'])(
    'preserves SQL when the name %j is rejected',
    async (name) => {
      await expect(updateSnippet(originalId, { name })).rejects.toThrow('Invalid name')

      expect(await fs.readFile(originalPath(), 'utf8')).toBe(originalSql)
      expect((await getSnippet(originalId)).content.sql).toBe(originalSql)
    }
  )

  it('preserves SQL when the destination folder no longer exists', async () => {
    const folderId = generateDeterministicUuid(['deleted-folder'])

    await expect(updateSnippet(originalId, { folder_id: folderId })).rejects.toThrow(
      `Folder with id ${folderId} not found`
    )

    expect(await fs.readFile(originalPath(), 'utf8')).toBe(originalSql)
  })

  it('preserves SQL when the destination cannot be written', async () => {
    await fs.mkdir(path.join(directory.path, 'blocked.sql'))

    await expect(updateSnippet(originalId, { name: 'blocked' })).rejects.toThrow()

    expect(await fs.readFile(originalPath(), 'utf8')).toBe(originalSql)
    expect((await fs.readdir(directory.path)).sort()).toEqual(['blocked.sql', 'original.sql'])
  })

  it('preserves the saved SQL and removes partial temporary files when a write fails', async () => {
    const writeFile = fs.writeFile.bind(fs)
    vi.spyOn(fs, 'writeFile').mockImplementationOnce(async (filePath) => {
      await writeFile(filePath, 'partial SQL')
      throw new Error('Disk full')
    })

    await expect(updateSnippet(originalId, { content: { sql: 'select 43;' } })).rejects.toThrow(
      'Disk full'
    )

    expect(await fs.readFile(originalPath(), 'utf8')).toBe(originalSql)
    expect(await fs.readdir(directory.path)).toEqual(['original.sql'])
  })

  it('preserves both snippets when the destination is already occupied', async () => {
    const targetPath = path.join(directory.path, 'existing.sql')
    await fs.writeFile(targetPath, 'select 7;')

    await expect(updateSnippet(originalId, { name: 'existing' })).rejects.toThrow('already exists')

    expect(await fs.readFile(originalPath(), 'utf8')).toBe(originalSql)
    expect(await fs.readFile(targetPath, 'utf8')).toBe('select 7;')
  })

  it.each(['select 43;', ''])('keeps content-only updates at the original path', async (sql) => {
    const updated = await updateSnippet(originalId, { content: { sql } })

    expect(updated.id).toBe(originalId)
    expect(updated.content.sql).toBe(sql)
    expect(await fs.readFile(originalPath(), 'utf8')).toBe(sql)
    expect(await fs.readdir(directory.path)).toEqual(['original.sql'])
  })

  it('renames and moves the snippet after saving its updated SQL', async () => {
    const folder = await createFolder('destination')
    const updated = await updateSnippet(originalId, {
      name: 'renamed',
      folder_id: folder.id,
      content: { sql: 'select 43;' },
    })

    expect(updated.name).toBe('renamed')
    expect(updated.folder_id).toBe(folder.id)
    expect(await fs.readFile(path.join(directory.path, 'destination', 'renamed.sql'), 'utf8')).toBe(
      'select 43;'
    )
    await expect(fs.access(originalPath())).rejects.toMatchObject({ code: 'ENOENT' })

    const moved = await updateSnippet(updated.id, { folder_id: null })

    expect(moved.folder_id).toBeNull()
    expect(await fs.readFile(path.join(directory.path, 'renamed.sql'), 'utf8')).toBe('select 43;')
    expect(await fs.readdir(path.join(directory.path, 'destination'))).toEqual([])
  })

  it('preserves SQL when only the filename casing changes', async () => {
    const updated = await updateSnippet(originalId, { name: 'Original' })

    expect(await fs.readdir(directory.path)).toEqual(['Original.sql'])
    expect((await getSnippet(updated.id)).content.sql).toBe(originalSql)
  })
})
