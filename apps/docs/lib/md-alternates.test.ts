import { promises as fs } from 'node:fs'
import path from 'node:path'
import { PROD_URL } from '~/lib/constants'
import { describe, expect, it, vi } from 'vitest'

import { mdAlternate } from './md-alternates'

vi.mock('~/public/markdown/manifest.json', () => ({
  default: [
    'getting-started/quickstarts/react',
    'troubleshooting/all-about-supabase-egress-a_Sg_e',
    'troubleshooting',
  ],
}))

describe('mdAlternate', () => {
  it('returns the absolute .md sibling for a manifest-listed guide slug', () => {
    expect(mdAlternate('getting-started/quickstarts/react')).toEqual({
      'text/markdown': `${PROD_URL}/guides/getting-started/quickstarts/react.md`,
    })
  })

  it('returns the sibling for a troubleshooting entry', () => {
    expect(mdAlternate('troubleshooting/all-about-supabase-egress-a_Sg_e')).toEqual({
      'text/markdown': `${PROD_URL}/guides/troubleshooting/all-about-supabase-egress-a_Sg_e.md`,
    })
  })

  it('returns the sibling for the troubleshooting index', () => {
    expect(mdAlternate('troubleshooting')).toEqual({
      'text/markdown': `${PROD_URL}/guides/troubleshooting.md`,
    })
  })

  it('returns undefined for slugs without generated markdown', () => {
    expect(mdAlternate('database/extensions/wrappers/s3')).toBeUndefined()
    expect(mdAlternate('local-development/cli/config')).toBeUndefined()
  })
})

const WIRING: [string, string][] = [
  ['features/docs/GuidesMdx.utils.tsx', 'mdAlternate('],
  ['app/guides/troubleshooting/[slug]/page.tsx', 'mdAlternate(`troubleshooting/${slug}`)'],
  ['app/guides/troubleshooting/page.tsx', "mdAlternate('troubleshooting')"],
  ['features/docs/TroubleshootingSection.page.tsx', 'mdAlternate(`${topic}/troubleshooting`)'],
]

describe('markdown alternate wiring', () => {
  it('every tag emitter routes through mdAlternate', async () => {
    for (const [file, wiring] of WIRING) {
      const source = await fs.readFile(path.join(process.cwd(), file), 'utf-8')
      expect(source.includes(wiring), `${file} must contain "${wiring}"`).toBe(true)
    }
  })

  it('the generator registers the troubleshooting index in the manifest', async () => {
    const source = await fs.readFile(
      path.join(process.cwd(), 'internals/generate-guides-markdown.ts'),
      'utf-8'
    )
    expect(source.includes("renderManifest(sources, ['troubleshooting'])")).toBe(true)
  })
})

const SCAN_ROOTS = ['app', 'components', 'features', 'lib', 'internals']
const ALLOWED_MD_LITERAL_FILES = new Set([
  'lib/md-alternates.ts',
  'app/api/guides-md/[...slug]/route.ts',
])

function isScannableSource(fileName: string): boolean {
  return (
    /\.(ts|tsx)$/.test(fileName) &&
    !/\.test\.(ts|tsx)$/.test(fileName) &&
    !fileName.endsWith('.d.ts')
  )
}

async function collectSourceFiles(dir: string): Promise<string[]> {
  const dirents = await fs.readdir(dir, { withFileTypes: true })
  const files: string[] = []
  for (const dirent of dirents) {
    const full = path.join(dir, dirent.name)
    if (dirent.isDirectory()) {
      if (dirent.name === 'node_modules') continue
      files.push(...(await collectSourceFiles(full)))
    } else if (isScannableSource(dirent.name)) {
      files.push(full)
    }
  }
  return files
}

describe('no hardcoded text/markdown outside the helper', () => {
  it('every text/markdown occurrence lives in an allowed file', async () => {
    const rootFiles = (await fs.readdir(process.cwd(), { withFileTypes: true }))
      .filter((dirent) => dirent.isFile() && isScannableSource(dirent.name))
      .map((dirent) => path.join(process.cwd(), dirent.name))
    const nestedFiles = (
      await Promise.all(
        SCAN_ROOTS.map((root) => collectSourceFiles(path.join(process.cwd(), root)))
      )
    ).flat()

    const offenders = (
      await Promise.all(
        [...rootFiles, ...nestedFiles].map(async (file) => {
          const rel = path.relative(process.cwd(), file)
          if (ALLOWED_MD_LITERAL_FILES.has(rel)) return null
          const source = await fs.readFile(file, 'utf-8')
          return source.includes('text/markdown') ? rel : null
        })
      )
    ).filter((rel): rel is string => rel !== null)
    expect(offenders, `hardcoded text/markdown in: ${offenders.join(', ')}`).toEqual([])
  })
})
