import { describe, expect, it } from 'vitest'

import { mergeToml } from './merge-toml'

describe('mergeToml', () => {
  it('deep-merges nested tables across files', () => {
    const result = mergeToml({
      path: 'config.toml',
      files: [
        { templateId: 'a', content: '[db]\nport = 54322\nenabled = true\n' },
        { templateId: 'b', content: '[db]\nmajor_version = 15\n[api]\nenabled = true\n' },
      ],
    })

    expect(result.warnings).toEqual([])
    expect(result.content).toContain('port = 54322')
    expect(result.content).toContain('major_version = 15')
    expect(result.content).toContain('[api]')
  })

  it('lets later files override scalar values on conflict', () => {
    const result = mergeToml({
      path: 'config.toml',
      files: [
        { templateId: 'a', content: '[db]\nport = 54322\n' },
        { templateId: 'b', content: '[db]\nport = 5433\n' },
      ],
    })

    expect(result.content).toContain('port = 5433')
    expect(result.content).not.toContain('port = 54322')
  })

  it('warns on malformed TOML instead of throwing', () => {
    const result = mergeToml({
      path: 'config.toml',
      files: [
        { templateId: 'good', content: '[db]\nport = 54322\n' },
        { templateId: 'broken', content: 'this is not [[valid toml = ::' },
      ],
    })

    expect(result.warnings.some((w) => w.includes('broken'))).toBe(true)
    expect(result.content).toContain('port = 54322')
  })

  it('preserves inline arrays of strings round-trip', () => {
    const result = mergeToml({
      path: 'config.toml',
      files: [{ templateId: 'a', content: '[api]\nschemas = ["public", "graphql_public"]\n' }],
    })

    expect(result.content).toMatch(/schemas\s*=\s*\[\s*"public"\s*,\s*"graphql_public"\s*\]/)
  })

  it('handles deeply nested tables (e.g. [db.seed])', () => {
    const result = mergeToml({
      path: 'config.toml',
      files: [
        {
          templateId: 'a',
          content: '[db.seed]\nenabled = true\nsql_paths = ["./seed.sql"]\n',
        },
        { templateId: 'b', content: '[db]\nport = 54322\n' },
      ],
    })

    expect(result.content).toMatch(/\[db\.seed\]/)
    expect(result.content).toContain('port = 54322')
    expect(result.content).toContain('enabled = true')
  })
})
