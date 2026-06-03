import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { FileSystemFunctionsSecretsStore } from './secretsStore'

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex')

describe('FileSystemFunctionsSecretsStore', () => {
  let folderPath: string
  let store: FileSystemFunctionsSecretsStore
  let envPath: string

  beforeEach(async () => {
    folderPath = await mkdtemp(path.join(os.tmpdir(), 'sb-secrets-'))
    store = new FileSystemFunctionsSecretsStore(folderPath)
    envPath = path.join(folderPath, '.env')
  })

  afterEach(async () => {
    await rm(folderPath, { recursive: true, force: true })
  })

  describe('listSecrets', () => {
    it('returns an empty list when no .env file exists', async () => {
      await expect(store.listSecrets()).resolves.toEqual([])
    })

    it('returns names with a SHA256 digest of the value (never plaintext)', async () => {
      await writeFile(envPath, 'API_KEY=super-secret\n', 'utf8')

      const secrets = await store.listSecrets()

      expect(secrets).toHaveLength(1)
      expect(secrets[0].name).toBe('API_KEY')
      expect(secrets[0].value).toBe(sha256('super-secret'))
      expect(secrets[0].value).not.toContain('super-secret')
      expect(typeof secrets[0].updated_at).toBe('string')
    })

    it('ignores comments, blank lines and malformed lines, and strips wrapping quotes', async () => {
      await writeFile(
        envPath,
        ['# a comment', '', 'GREETING="hello world"', 'no_separator_here', 'TOKEN=abc'].join('\n'),
        'utf8'
      )

      const secrets = await store.listSecrets()
      const byName = Object.fromEntries(secrets.map((s) => [s.name, s.value]))

      expect(Object.keys(byName).sort()).toEqual(['GREETING', 'TOKEN'])
      expect(byName.GREETING).toBe(sha256('hello world'))
      expect(byName.TOKEN).toBe(sha256('abc'))
    })
  })

  describe('upsertSecrets', () => {
    it('creates the .env file and writes plain KEY=value lines', async () => {
      await store.upsertSecrets([{ name: 'FOO', value: 'bar' }])

      const contents = await readFile(envPath, 'utf8')
      expect(contents).toContain('FOO=bar')
    })

    it('replaces an existing key and keeps the others', async () => {
      await store.upsertSecrets([
        { name: 'A', value: '1' },
        { name: 'B', value: '2' },
      ])
      await store.upsertSecrets([{ name: 'A', value: '99' }])

      const secrets = await store.listSecrets()
      const byName = Object.fromEntries(secrets.map((s) => [s.name, s.value]))

      expect(byName.A).toBe(sha256('99'))
      expect(byName.B).toBe(sha256('2'))
    })

    it('throws on an invalid secret name', async () => {
      await expect(store.upsertSecrets([{ name: 'bad name', value: 'x' }])).rejects.toThrow(
        'Invalid secret name'
      )
    })

    it('throws when a value contains a newline', async () => {
      await expect(store.upsertSecrets([{ name: 'MULTI', value: 'a\nb' }])).rejects.toThrow(
        'must not contain newlines'
      )
    })
  })

  describe('deleteSecrets', () => {
    it('removes the named secrets and keeps the rest', async () => {
      await store.upsertSecrets([
        { name: 'KEEP', value: '1' },
        { name: 'DROP', value: '2' },
      ])

      await store.deleteSecrets(['DROP'])

      const secrets = await store.listSecrets()
      expect(secrets.map((s) => s.name)).toEqual(['KEEP'])
    })

    it('is a no-op when no name matches', async () => {
      await store.upsertSecrets([{ name: 'KEEP', value: '1' }])
      await expect(store.deleteSecrets(['NON_EXISTENT'])).resolves.toBeUndefined()

      const secrets = await store.listSecrets()
      expect(secrets.map((s) => s.name)).toEqual(['KEEP'])
    })
  })
})
