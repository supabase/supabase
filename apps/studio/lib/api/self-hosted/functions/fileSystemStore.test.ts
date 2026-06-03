import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { mkdirSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { FileSystemFunctionsArtifactStore, getStableFunctionId } from './fileSystemStore'

describe('FileSystemFunctionsArtifactStore (write operations)', () => {
  let folderPath: string
  let store: FileSystemFunctionsArtifactStore

  beforeEach(async () => {
    folderPath = await mkdtemp(path.join(os.tmpdir(), 'sb-functions-'))
    store = new FileSystemFunctionsArtifactStore(folderPath)
  })

  afterEach(async () => {
    await rm(folderPath, { recursive: true, force: true })
  })

  describe('deployFunction', () => {
    it('writes the provided files to disk under the slug folder', async () => {
      const artifact = await store.deployFunction('hello-world', [
        { name: 'index.ts', content: 'export default () => new Response("ok")' },
        { name: 'utils/helper.ts', content: 'export const helper = () => 1' },
      ])

      expect(artifact.slug).toBe('hello-world')

      const indexContent = await readFile(
        path.join(folderPath, 'hello-world', 'index.ts'),
        'utf8'
      )
      expect(indexContent).toContain('new Response("ok")')

      const helperContent = await readFile(
        path.join(folderPath, 'hello-world', 'utils', 'helper.ts'),
        'utf8'
      )
      expect(helperContent).toContain('export const helper')

      const functions = await store.getFunctions()
      expect(functions.map((f) => f.slug)).toContain('hello-world')
    })

    it('lists functions whose entrypoint is not named index', async () => {
      await store.deployFunction('custom-entry', [
        { name: 'server.ts', content: 'export default () => new Response("ok")' },
      ])

      const functions = await store.getFunctions()
      expect(functions.map((f) => f.slug)).toContain('custom-entry')
    })

    it('replaces the whole bundle, removing files no longer present', async () => {
      await store.deployFunction('my-fn', [
        { name: 'index.ts', content: 'v1' },
        { name: 'stale.ts', content: 'remove me' },
      ])

      await store.deployFunction('my-fn', [{ name: 'index.ts', content: 'v2' }])

      const indexContent = await readFile(path.join(folderPath, 'my-fn', 'index.ts'), 'utf8')
      expect(indexContent).toBe('v2')

      await expect(stat(path.join(folderPath, 'my-fn', 'stale.ts'))).rejects.toThrow()
    })

    it('throws on an invalid slug', async () => {
      await expect(
        store.deployFunction('../escape', [{ name: 'index.ts', content: 'x' }])
      ).rejects.toThrow('Invalid function slug')
    })

    it('throws when a file path would escape the function folder', async () => {
      await expect(
        store.deployFunction('safe-fn', [{ name: '../../evil.ts', content: 'x' }])
      ).rejects.toThrow('escapes the functions directory')
    })

    it('throws when no files are provided', async () => {
      await expect(store.deployFunction('empty-fn', [])).rejects.toThrow(
        'At least one file is required'
      )
    })
  })

  describe('getStableFunctionId', () => {
    it('is deterministic for a given slug and UUID-formatted', () => {
      const id = getStableFunctionId('hello-world')
      expect(id).toBe(getStableFunctionId('hello-world'))
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    })

    it('differs across slugs', () => {
      expect(getStableFunctionId('a')).not.toBe(getStableFunctionId('b'))
    })
  })

  describe('deleteFunction', () => {
    it('removes the function folder from disk', async () => {
      await store.deployFunction('to-delete', [{ name: 'index.ts', content: 'x' }])
      await store.deleteFunction('to-delete')

      await expect(stat(path.join(folderPath, 'to-delete'))).rejects.toThrow()
    })

    it('is a no-op when the function does not exist', async () => {
      await expect(store.deleteFunction('does-not-exist')).resolves.toBeUndefined()
    })

    it('throws on an invalid slug', async () => {
      await expect(store.deleteFunction('../escape')).rejects.toThrow('Invalid function slug')
    })

    it('does not touch sibling files outside the slug folder', async () => {
      mkdirSync(path.join(folderPath, 'keep-me'))
      await writeFile(path.join(folderPath, 'keep-me', 'index.ts'), 'keep', 'utf8')

      await store.deployFunction('remove-me', [{ name: 'index.ts', content: 'x' }])
      await store.deleteFunction('remove-me')

      const kept = await readFile(path.join(folderPath, 'keep-me', 'index.ts'), 'utf8')
      expect(kept).toBe('keep')
    })
  })
})
