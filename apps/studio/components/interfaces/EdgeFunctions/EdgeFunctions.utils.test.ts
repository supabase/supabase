import { describe, expect, it } from 'vitest'

import { formatFunctionBodyToFiles, getDefaultSelectedFileId } from './EdgeFunctions.utils'

describe('formatFunctionBodyToFiles', () => {
  it('returns no files when there is no entrypoint path', () => {
    const files = [{ name: 'index.ts', content: 'a' }]
    const result = formatFunctionBodyToFiles({ functionBody: { files, metadata: {} } })
    expect(result).toEqual([])
  })

  it('rewrites nested file paths relative to a nested entrypoint', () => {
    const files = [
      { name: 'functions/hello/index.ts', content: 'a' },
      { name: 'functions/hello/utils/helper.ts', content: 'b' },
    ]
    const result = formatFunctionBodyToFiles({
      functionBody: { files, metadata: { deno2_entrypoint_path: 'functions/hello/index.ts' } },
    })
    expect(result.map((f) => f.name)).toEqual(['index.ts', 'utils/helper.ts'])
  })

  it('leaves file paths unmodified when the entrypoint is a bare filename at the root', () => {
    const files = [{ name: 'index.ts', content: 'a' }]
    const result = formatFunctionBodyToFiles({
      functionBody: { files, metadata: { deno2_entrypoint_path: 'index.ts' } },
    })
    expect(result.map((f) => f.name)).toEqual(['index.ts'])
  })

  it('falls back to parsing a URL entrypoint when no file name matches', () => {
    const files = [
      { name: 'functions/hello/index.ts', content: 'a' },
      { name: 'functions/hello/utils/helper.ts', content: 'b' },
    ]
    const result = formatFunctionBodyToFiles({
      functionBody: { files, metadata: {} },
      entrypointPath: 'https://edge.supabase.com/deploy/abc123/main.ts',
    })
    // the URL's parsed base path ('/deploy/abc123') shares no common prefix with
    // the relative file names, so they're left unmodified (per commonPath)
    expect(result.map((f) => f.name)).toEqual([
      'functions/hello/index.ts',
      'functions/hello/utils/helper.ts',
    ])
  })

  it('leaves a file unmodified when it shares no common path with the base path', () => {
    const files = [
      { name: 'functions/hello/index.ts', content: 'a' },
      { name: 'unrelated/other.ts', content: 'b' },
    ]
    const result = formatFunctionBodyToFiles({
      functionBody: { files, metadata: { deno2_entrypoint_path: 'functions/hello/index.ts' } },
    })
    expect(result.map((f) => f.name)).toEqual(['index.ts', 'unrelated/other.ts'])
  })

  it('assigns sequential ids and preserves content', () => {
    const files = [
      { name: 'a.ts', content: 'foo' },
      { name: 'b.ts', content: 'bar' },
    ]
    const result = formatFunctionBodyToFiles({
      functionBody: { files, metadata: { deno2_entrypoint_path: 'a.ts' } },
    })
    expect(result).toEqual([
      { id: 1, name: 'a.ts', content: 'foo', state: 'unchanged' },
      { id: 2, name: 'b.ts', content: 'bar', state: 'unchanged' },
    ])
  })
})

describe('formatFunctionBodyToFiles sorting', () => {
  const format = (names: string[], entrypoint = 'index.ts') =>
    formatFunctionBodyToFiles({
      functionBody: {
        files: names.map((name) => ({ name, content: '' })),
        metadata: { deno2_entrypoint_path: entrypoint },
      },
    })

  it('sorts files by name', () => {
    const result = format(['utils.ts', 'index.ts', 'deno.json'])
    expect(result.map((f) => f.name)).toEqual(['deno.json', 'index.ts', 'utils.ts'])
  })

  it('sorts numerically so file2 comes before file10', () => {
    const result = format(['file10.ts', 'file2.ts', 'index.ts'])
    expect(result.map((f) => f.name)).toEqual(['file2.ts', 'file10.ts', 'index.ts'])
  })

  it('sorts case-insensitively', () => {
    const result = format(['b.ts', 'A.ts', 'index.ts'])
    expect(result.map((f) => f.name)).toEqual(['A.ts', 'b.ts', 'index.ts'])
  })

  it('sorts by relative name after rewriting nested paths', () => {
    const result = formatFunctionBodyToFiles({
      functionBody: {
        files: [
          { name: 'functions/hello/utils/helper.ts', content: '' },
          { name: 'functions/hello/index.ts', content: '' },
        ],
        metadata: { deno2_entrypoint_path: 'functions/hello/index.ts' },
      },
    })
    expect(result.map((f) => f.name)).toEqual(['index.ts', 'utils/helper.ts'])
  })

  it('assigns unique sequential ids following sorted order', () => {
    const result = format(['c.ts', 'a.ts', 'index.ts', 'b.ts'])
    expect(result.map((f) => [f.id, f.name])).toEqual([
      [1, 'a.ts'],
      [2, 'b.ts'],
      [3, 'c.ts'],
      [4, 'index.ts'],
    ])
  })
})

describe('getDefaultSelectedFileId', () => {
  const files = [
    { id: 1, name: 'a.ts' },
    { id: 2, name: 'handler.ts' },
    { id: 3, name: 'index.ts' },
  ]

  it('selects the entrypoint file', () => {
    expect(getDefaultSelectedFileId(files, 'handler.ts')).toBe(2)
  })

  it('matches on the basename of a nested entrypoint path', () => {
    expect(getDefaultSelectedFileId(files, 'functions/hello/handler.ts')).toBe(2)
  })

  it('matches on the basename of a URL entrypoint', () => {
    expect(
      getDefaultSelectedFileId(files, 'https://edge.supabase.com/deploy/abc123/handler.ts')
    ).toBe(2)
  })

  it('falls back to index.ts when the entrypoint matches no file', () => {
    expect(getDefaultSelectedFileId(files, 'missing.ts')).toBe(3)
  })

  it('falls back to index.ts when there is no entrypoint', () => {
    expect(getDefaultSelectedFileId(files)).toBe(3)
    expect(getDefaultSelectedFileId(files, null)).toBe(3)
  })

  it('falls back to the first file when there is no index.ts', () => {
    expect(getDefaultSelectedFileId(files.slice(0, 2), 'missing.ts')).toBe(1)
  })

  it('returns undefined when there are no files', () => {
    expect(getDefaultSelectedFileId([], 'index.ts')).toBeUndefined()
  })

  it('selects the entrypoint closest to the root when several files match its path', () => {
    const entrypointPath = 'functions/hello/index.ts'

    for (const names of [
      ['index.ts', 'functions/hello/index.ts'],
      ['functions/hello/index.ts', 'index.ts'],
    ]) {
      const files = formatFunctionBodyToFiles({
        functionBody: {
          files: names.map((name) => ({ name, content: name })),
          metadata: { deno2_entrypoint_path: entrypointPath },
        },
      })
      const id = getDefaultSelectedFileId(files, entrypointPath)

      expect(files.map((f) => f.name)).toEqual(['functions/hello/index.ts', 'index.ts'])
      expect(files.find((f) => f.id === id)?.name).toBe('index.ts')
    }
  })

  it('does not match a file name that only shares trailing characters', () => {
    const entrypointPath = 'functions/hello/index.ts'
    const files = formatFunctionBodyToFiles({
      functionBody: {
        files: ['dex.ts', 'index.ts'].map((name) => ({ name, content: name })),
        metadata: { deno2_entrypoint_path: entrypointPath },
      },
    })
    const id = getDefaultSelectedFileId(files, entrypointPath)

    expect(files.find((f) => f.id === id)?.name).toBe('index.ts')
  })
})
