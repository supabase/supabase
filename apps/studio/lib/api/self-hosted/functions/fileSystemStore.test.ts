import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { FileSystemFunctionsArtifactStore } from './fileSystemStore'

describe('api/self-hosted/functions/fileSystemStore', () => {
  let root: string

  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), 'studio-functions-'))
  })

  afterEach(async () => {
    await rm(root, { recursive: true, force: true })
  })

  describe('when the functions folder does not exist', () => {
    it('getFunctions returns an empty list', async () => {
      const store = new FileSystemFunctionsArtifactStore(path.join(root, 'functions'))

      await expect(store.getFunctions()).resolves.toEqual([])
    })

    it('getFunctionBySlug returns undefined', async () => {
      const store = new FileSystemFunctionsArtifactStore(path.join(root, 'functions'))

      await expect(store.getFunctionBySlug('hello')).resolves.toBeUndefined()
    })
  })

  it('getFunctions still throws when the functions path is not a directory', async () => {
    const file = path.join(root, 'functions')
    await writeFile(file, '')
    const store = new FileSystemFunctionsArtifactStore(file)

    await expect(store.getFunctions()).rejects.toMatchObject({ code: 'ENOTDIR' })
  })
})
