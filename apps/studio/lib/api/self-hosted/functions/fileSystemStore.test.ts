import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { FileSystemFunctionsArtifactStore } from './fileSystemStore'

describe('FileSystemFunctionsArtifactStore with a missing functions folder', () => {
  it('getFunctions returns an empty list instead of throwing ENOENT', async () => {
    const store = new FileSystemFunctionsArtifactStore(
      path.join(tmpdir(), `no-such-functions-${Date.now()}`)
    )

    await expect(store.getFunctions()).resolves.toEqual([])
  })

  it('getFunctionBySlug returns undefined instead of throwing ENOENT', async () => {
    const store = new FileSystemFunctionsArtifactStore(
      path.join(tmpdir(), `no-such-functions-${Date.now()}`)
    )

    await expect(store.getFunctionBySlug('hello')).resolves.toBeUndefined()
  })

  it('getFileEntriesBySlug returns an empty list instead of throwing ENOENT', async () => {
    const store = new FileSystemFunctionsArtifactStore(
      path.join(tmpdir(), `no-such-functions-${Date.now()}`)
    )

    await expect(store.getFileEntriesBySlug('hello')).resolves.toEqual([])
  })

  it('getFunctions still lists a function folder with an entrypoint', async () => {
    const base = await mkdtemp(path.join(tmpdir(), 'functions-'))
    await mkdir(path.join(base, 'hello'))
    await writeFile(path.join(base, 'hello', 'index.ts'), 'export default 1')
    const store = new FileSystemFunctionsArtifactStore(base)

    const functions = await store.getFunctions()

    expect(functions.map((f) => f.slug)).toEqual(['hello'])
    expect(functions[0].entrypoint_path.endsWith('index.ts')).toBe(true)
  })
})
