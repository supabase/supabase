import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { deriveOverviewPagePaths } from '~/lib/derive-overview-page-paths'
import { GUIDES_DIRECTORY } from '~/lib/docs'
import { describe, expect, it } from 'vitest'

describe('deriveOverviewPagePaths', () => {
  it('includes known section and subsection hubs', () => {
    const paths = deriveOverviewPagePaths()

    expect(paths).toContain('database/overview.mdx')
    expect(paths).toContain('auth/server-side.mdx')
    expect(paths).toContain('realtime/getting_started.mdx')
    expect(paths).toContain('cli.mdx')
    expect(paths).toContain('resources.mdx')
  })

  it('excludes graphql and tutorial getting-started pages', () => {
    const paths = deriveOverviewPagePaths()

    expect(paths.some((path) => path.includes('graphql'))).toBe(false)
    expect(paths).not.toContain('local-development/cli/getting-started.mdx')
    expect(paths).not.toContain('auth/oauth-server/getting-started.mdx')
  })

  it('returns only paths that exist on disk', () => {
    const paths = deriveOverviewPagePaths()

    for (const relPath of paths) {
      expect(existsSync(join(GUIDES_DIRECTORY, relPath))).toBe(true)
    }
  })

  it('returns a stable count in the expected range', () => {
    const paths = deriveOverviewPagePaths()

    expect(paths.length).toBeGreaterThanOrEqual(40)
    expect(paths.length).toBeLessThanOrEqual(55)
  })
})
