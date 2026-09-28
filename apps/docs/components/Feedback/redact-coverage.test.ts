import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('data-feedback-redact coverage', () => {
  const projectDataComponents = findTsxFiles(DOCS_ROOT).filter((file) =>
    importsProjectDataHook(readFileSync(file, 'utf8'))
  )

  it('finds the components that query project data', () => {
    expect(projectDataComponents.map((file) => relative(DOCS_ROOT, file))).toEqual(
      expect.arrayContaining([
        'components/ProjectConfigVariables/ProjectConfigVariables.tsx',
        'features/ui/McpConfigPanel.tsx',
      ])
    )
  })

  it.each(projectDataComponents.map((file) => [relative(DOCS_ROOT, file), file]))(
    '%s marks project data with data-feedback-redact',
    (_, file) => {
      expect(readFileSync(file, 'utf8')).toContain(REDACT_ATTRIBUTE)
    }
  )

  it.each(REQUIRED_FILES)('%s marks project data with data-feedback-redact', (file) => {
    expect(readFileSync(resolve(REPO_ROOT, file), 'utf8')).toContain(REDACT_ATTRIBUTE)
  })
})

const importsProjectDataHook = (source: string): boolean =>
  [...source.matchAll(PROJECT_DATA_IMPORT)].some(({ groups }) =>
    (groups?.specifiers ?? '')
      .split(',')
      .map((specifier) => specifier.trim())
      .some((specifier) => /^use\w*Query\b/.test(specifier))
  )

const findTsxFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith('.') || SKIPPED_DIRS.has(entry.name)) return []
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return findTsxFiles(path)
    return entry.name.endsWith('.tsx') ? [path] : []
  })

const REDACT_ATTRIBUTE = 'data-feedback-redact'

const DOCS_ROOT = resolve(import.meta.dirname, '../..')

const REPO_ROOT = resolve(DOCS_ROOT, '../..')

// type-only specifiers never start with use
const PROJECT_DATA_IMPORT =
  /import\s+(?!type\b)\{(?<specifiers>[^}]*)\}\s*from\s*['"]~\/lib\/fetch\/(?:projectApi|organizations|projects-infinite|branches|pooler)['"]/g

const SKIPPED_DIRS = new Set(['node_modules', 'public', 'examples', 'content'])

// props or portals hide project data from the import scan
const REQUIRED_FILES = [
  'apps/docs/components/ProjectConfigVariables/ProjectConfigVariables.ComboBox.tsx',
  'apps/docs/features/ui/McpConfigPanel.tsx',
  'packages/ui-patterns/src/McpUrlBuilder/McpConfigPanel.tsx',
]
