import { describe, expect, it } from 'vitest'

import {
  extractFromFile,
  inferLanguage,
  mergeFileEntries,
  resolveFileHandler,
} from './file-registry'

describe('resolveFileHandler', () => {
  it('matches by extension', () => {
    expect(resolveFileHandler('supabase/config.toml')?.id).toBe('toml')
    expect(resolveFileHandler('supabase/schema.sql')?.id).toBe('sql')
    expect(resolveFileHandler('script.json')?.id).toBe('json')
  })

  it('prefers path matcher over extension', () => {
    // edge function path matches .ts but should route to the edge-function handler
    expect(resolveFileHandler('supabase/functions/webhook/index.ts')?.id).toBe('edge-function')
  })

  it('returns undefined for unknown extensions', () => {
    expect(resolveFileHandler('readme.md')).toBeUndefined()
  })

  it('is case-insensitive on extensions', () => {
    expect(resolveFileHandler('Config.TOML')?.id).toBe('toml')
  })
})

describe('inferLanguage', () => {
  it.each([
    ['supabase/config.toml', 'toml'],
    ['supabase/schema.sql', 'sql'],
    ['component.tsx', 'tsx'],
    ['script.ts', 'typescript'],
    ['script.js', 'javascript'],
    ['data.json', 'json'],
    ['supabase/functions/webhook/index.ts', 'typescript'],
    ['readme.md', 'text'],
  ])('infers language for %s as %s', (path, expected) => {
    expect(inferLanguage(path)).toBe(expected)
  })
})

describe('mergeFileEntries fallback', () => {
  it('falls back to last-wins with a warning when no merge strategy is registered', () => {
    const result = mergeFileEntries({
      path: 'script.ts',
      files: [
        { templateId: 'a', content: 'export const x = 1' },
        { templateId: 'b', content: 'export const x = 2' },
      ],
    })

    expect(result.content).toBe('export const x = 2')
    expect(result.warnings[0]).toContain('script.ts')
    expect(result.warnings[0]).toContain('b')
  })

  it('routes edge-function conflicts deterministically (alphabetical first-wins)', () => {
    const result = mergeFileEntries({
      path: 'supabase/functions/webhook/index.ts',
      files: [
        { templateId: 'zeta', content: 'export default zeta' },
        { templateId: 'alpha', content: 'export default alpha' },
      ],
    })

    expect(result.content).toBe('export default alpha')
    expect(result.warnings[0]).toContain('Duplicate edge function "webhook"')
    expect(result.warnings[0]).toContain('using alpha')
  })
})

describe('extractFromFile', () => {
  it('returns [] for files without a registered extractor', () => {
    expect(
      extractFromFile({ path: 'script.tsx', content: 'export default null', templateId: 't' })
    ).toEqual([])
  })

  it('extracts edge functions via path matcher', () => {
    const candidates = extractFromFile({
      path: 'supabase/functions/webhook/index.ts',
      content: '',
      templateId: 't',
    })

    expect(candidates).toEqual([
      expect.objectContaining({
        id: 'edge-function:webhook',
        kind: 'edge-function',
        parentResourceId: 'config:edge_runtime',
      }),
    ])
  })

  it('extracts SQL tables with schema as parent', () => {
    const candidates = extractFromFile({
      path: 'schema.sql',
      content: 'create table public.todos (id int);',
      templateId: 't',
    })

    const table = candidates.find((c) => c.kind === 'table')
    expect(table?.parentResourceId).toBe('schema:public')
    expect(table?.schema).toBe('public')
    expect(table?.iconKey).toBe('table')
  })
})
