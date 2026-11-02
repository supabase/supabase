import { describe, expect, it } from 'vitest'

import { findBrokenAnchors, hasBypassLabel } from './check-removed-anchors'

const page = 'apps/docs/content/guides/example.mdx'
const route = '/guides/example'

function check(base: Record<string, string>, head: Record<string, string>) {
  return findBrokenAnchors({
    changedFiles: Object.keys(head).filter((file) => base[file] !== head[file]),
    readBase: async (file) => base[file],
    readHead: async (file) => head[file],
    findFiles: async (needle) => Object.keys(head).filter((file) => head[file].includes(needle)),
  })
}

describe('findBrokenAnchors', () => {
  it('reports only removed headings that something links to, matching custom ids', async () => {
    const linker = 'apps/docs/content/troubleshooting/example.mdx'
    const base = {
      [page]: '## Kept\n\nOld body.\n\n## Rotate a key [#leaked-key]\n\n## Unlinked\n',
      [linker]: '[a](/docs/guides/example#kept)\n[b](/docs/guides/example#leaked-key)\n',
    }
    const head = {
      ...base,
      [page]:
        '## Kept\n\nFor more information about rotating keys, see [Rotate keys](/docs/guides/rotate).\n',
    }

    expect(await check(base, head)).toEqual([
      { page, route, anchor: 'leaked-key', linkedFrom: [{ file: linker, line: 2 }] },
    ])
  })

  it('names links from other apps and from the same page', async () => {
    const studio = 'apps/studio/components/Example.tsx'
    const blog = 'apps/www/_blog/example.mdx'
    const base = {
      [page]: 'See [the setup](#set-up).\n\n## Set up\n',
      [studio]: "const DOCS_LINK = '/guides/example#set-up'\n",
      [blog]: '[Set up](https://supabase.com/docs/guides/example/?ref=nav#set-up)\n',
    }
    const head = { ...base, [page]: 'See [the setup](#set-up).\n' }

    expect(await check(base, head)).toEqual([
      {
        page,
        route,
        anchor: 'set-up',
        linkedFrom: [
          { file: page, line: 1 },
          { file: studio, line: 1 },
          { file: blog, line: 1 },
        ],
      },
    ])
  })

  it('passes when the same change updates every link', async () => {
    const linker = 'apps/studio/components/Example.tsx'
    const base = {
      [page]: '## Set up\n',
      [linker]: "const DOCS_LINK = '/guides/example#set-up'\n",
    }
    const head = {
      [page]: '## New home\n',
      [linker]: "const DOCS_LINK = '/guides/example#new-home'\n",
    }

    expect(await check(base, head)).toEqual([])
  })

  it('fails when a heading is removed from a nested partial', async () => {
    const linker = 'apps/docs/content/troubleshooting/example.mdx'
    const outer = 'apps/docs/content/_partials/outer.mdx'
    const inner = 'apps/docs/content/_partials/inner.mdx'
    const shared = {
      [page]: '<$Partial path="outer.mdx" variables={{ "name": "Shared" }} />\n',
      [outer]: '<$Partial path="inner.mdx" variables={{ "name": "{{ .name }}" }} />\n',
      [linker]: '[Shared section](/docs/guides/example#shared-section)\n',
    }
    const base = { ...shared, [inner]: '## {{ .name }} section\n' }
    const head = { ...shared, [inner]: '## Other section\n' }

    expect(await check(base, head)).toEqual([
      { page, route, anchor: 'shared-section', linkedFrom: [{ file: linker, line: 1 }] },
    ])
  })
})

describe('hasBypassLabel', () => {
  it('recognizes the bypass label among the PR labels', () => {
    expect(hasBypassLabel('["documentation","skip-anchor-check"]')).toBe(true)
    expect(hasBypassLabel('["documentation"]')).toBe(false)
    expect(hasBypassLabel(undefined)).toBe(false)
  })
})
