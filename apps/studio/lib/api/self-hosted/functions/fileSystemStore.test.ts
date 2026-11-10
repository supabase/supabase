import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { FileSystemFunctionsArtifactStore } from './fileSystemStore'

describe('FileSystemFunctionsArtifactStore', () => {
  let rootDir: string

  beforeEach(async () => {
    rootDir = await mkdtemp(path.join(tmpdir(), 'functions-store-'))
  })

  afterEach(async () => {
    await rm(rootDir, { recursive: true, force: true })
  })

  describe('when the functions folder does not exist', () => {
    it('getFunctions returns an empty list', async () => {
      const store = new FileSystemFunctionsArtifactStore(path.join(rootDir, 'missing'))

      await expect(store.getFunctions()).resolves.toEqual([])
    })

    it('getFunctionBySlug returns undefined', async () => {
      const store = new FileSystemFunctionsArtifactStore(path.join(rootDir, 'missing'))

      await expect(store.getFunctionBySlug('hello')).resolves.toBeUndefined()
    })
  })

  it('rethrows errors other than a missing folder', async () => {
    const filePath = path.join(rootDir, 'not-a-folder')
    await writeFile(filePath, '')
    const store = new FileSystemFunctionsArtifactStore(filePath)

    await expect(store.getFunctions()).rejects.toMatchObject({ code: 'ENOTDIR' })
  })

  it('lists functions that have an index entrypoint, skipping main', async () => {
    await mkdir(path.join(rootDir, 'hello'))
    await writeFile(path.join(rootDir, 'hello', 'index.ts'), '')
    await mkdir(path.join(rootDir, 'main'))
    await writeFile(path.join(rootDir, 'main', 'index.ts'), '')
    await mkdir(path.join(rootDir, 'no-entrypoint'))
    const store = new FileSystemFunctionsArtifactStore(rootDir)

    const functions = await store.getFunctions()

    expect(functions.map((f) => f.slug)).toEqual(['hello'])
  })
})
