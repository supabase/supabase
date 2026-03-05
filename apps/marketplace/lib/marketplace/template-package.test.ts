import { describe, expect, it } from 'vitest'

import {
  hasRequiredTemplateEntries,
  inferTemplateRootPrefix,
  normalizeTemplatePath,
  normalizeTemplatePaths,
  shouldIgnoreTemplatePath,
} from './template-package'

describe('template-package utils', () => {
  it('ignores macOS artifacts and metadata files', () => {
    expect(shouldIgnoreTemplatePath('__MACOSX/foo.txt')).toBe(true)
    expect(shouldIgnoreTemplatePath('foo/.DS_Store')).toBe(true)
    expect(shouldIgnoreTemplatePath('foo/._bar.sql')).toBe(true)
    expect(shouldIgnoreTemplatePath('functions/main.ts')).toBe(false)
  })

  it('normalizes paths with a shared root folder', () => {
    expect(normalizeTemplatePath('my-template/functions/index.ts', 'my-template')).toBe(
      'functions/index.ts'
    )
    expect(normalizeTemplatePath('/my-template/template.json', 'my-template')).toBe('template.json')
  })

  it('infers top-level root prefix only when all entries share one', () => {
    expect(inferTemplateRootPrefix(['pkg/functions/a.ts', 'pkg/schemas/a.sql'])).toBe('pkg')
    expect(inferTemplateRootPrefix(['a/functions/a.ts', 'b/schemas/a.sql'])).toBeNull()
  })

  it('normalizes and filters template paths', () => {
    expect(
      normalizeTemplatePaths([
        'pkg/functions/index.ts',
        'pkg/schemas/001.sql',
        'pkg/template.json',
        '__MACOSX/skip',
      ])
    ).toEqual(['functions/index.ts', 'schemas/001.sql', 'template.json'])
  })

  it('validates required template package entries', () => {
    expect(
      hasRequiredTemplateEntries(['pkg/functions/a.ts', 'pkg/schemas/a.sql', 'pkg/template.json'])
    ).toBe(true)
    expect(hasRequiredTemplateEntries(['pkg/functions/a.ts', 'pkg/schemas/a.sql'])).toBe(false)
  })
})
