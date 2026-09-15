import { describe, expect, it } from 'vitest'

import { formatFunctionBodyToFiles } from './EdgeFunctions.utils'

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
