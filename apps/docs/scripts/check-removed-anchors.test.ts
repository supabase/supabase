import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  findBrokenAnchors,
  findInWorkingTree,
  hasBypassLabel,
  readFromWorkingTree,
  type ReadContent,
} from './check-removed-anchors'

const REPO_ROOT = join(import.meta.dirname, '..', '..', '..')
const CONTENT = 'apps/docs/content/'
const API_KEYS = `${CONTENT}guides/getting-started/api-keys.mdx`
const GOING_INTO_PROD = `${CONTENT}guides/deployment/going-into-prod.mdx`
const LEAKED_KEY_LINKER = `${CONTENT}troubleshooting/rotating-anon-service-and-jwt-secrets-1Jq6yd.mdx`
const LEAKED_KEY_HEADING = '### Rotate a leaked or compromised key [#leaked-key]'

const readBase = readFromWorkingTree(REPO_ROOT)

function checkRealContent(edits: Record<string, (source: string) => string>) {
  const readHead: ReadContent = async (contentPath) => {
    const source = await readBase(contentPath)
    const edit = edits[contentPath]
    return source === undefined || !edit ? source : edit(source)
  }
  return findBrokenAnchors({
    changedFiles: Object.keys(edits),
    readBase,
    readHead,
    findFiles: findInWorkingTree(REPO_ROOT),
  })
}

function checkFixtures(base: Record<string, string>, head: Record<string, string>) {
  return findBrokenAnchors({
    changedFiles: Object.keys(head).filter((file) => base[file] !== head[file]),
    readBase: async (file) => base[file],
    readHead: async (file) => head[file],
    findFiles: async (needle) => Object.keys(head).filter((file) => head[file].includes(needle)),
  })
}

const replaceOrThrow = (search: string | RegExp, replacement: string) => (source: string) => {
  const result = source.replace(search, replacement)
  if (result === source) throw new Error(`Test fixture is stale: ${search} not found`)
  return result
}

const section = (heading: string) =>
  new RegExp(
    `^${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n[\\s\\S]*?(?=^#{2,3} |(?![\\s\\S]))`,
    'm'
  )

describe('findBrokenAnchors', () => {
  it('fails when a linked custom id is removed, naming each link', async () => {
    const broken = await checkRealContent({
      [API_KEYS]: replaceOrThrow(LEAKED_KEY_HEADING, '### Rotate a leaked or compromised key'),
    })

    expect(broken).toEqual([
      {
        page: API_KEYS,
        route: '/guides/getting-started/api-keys',
        anchor: 'leaked-key',
        linkedFrom: [{ file: LEAKED_KEY_LINKER, line: expect.any(Number) }],
      },
    ])
  })

  it('fails for the four linked going-into-prod anchors, not the unlinked one', async () => {
    const removed = [
      '## Security',
      '## Performance',
      '## Deployment',
      '## Rate limiting, resource allocation, & abuse prevention',
      '### Auth rate limits',
    ]
    const broken = await checkRealContent({
      [GOING_INTO_PROD]: (source) =>
        removed.reduce((result, heading) => replaceOrThrow(section(heading), '')(result), source),
    })

    expect(broken.map(({ anchor }) => anchor).sort()).toEqual([
      'auth-rate-limits',
      'performance',
      'rate-limiting-resource-allocation--abuse-prevention',
      'security',
    ])
  })

  it('names links from other apps and from the same page', async () => {
    const page = `${CONTENT}guides/example.mdx`
    const studio = 'apps/studio/components/Example.tsx'
    const blog = 'apps/www/_blog/example.mdx'
    const base: Record<string, string> = {
      [page]: 'See [the setup](#set-up).\n\n## Set up\n',
      [studio]: "const DOCS_LINK = '/guides/example#set-up'\n",
      [blog]: '[Set up](https://supabase.com/docs/guides/example/?ref=nav#set-up)\n',
    }
    const head = { ...base, [page]: 'See [the setup](#set-up).\n' }

    expect(await checkFixtures(base, head)).toEqual([
      {
        page,
        route: '/guides/example',
        anchor: 'set-up',
        linkedFrom: [
          { file: page, line: 1 },
          { file: studio, line: 1 },
          { file: blog, line: 1 },
        ],
      },
    ])
  })

  it('passes when the heading stays with a summary and a link', async () => {
    const broken = await checkRealContent({
      [API_KEYS]: replaceOrThrow(
        section(LEAKED_KEY_HEADING),
        `${LEAKED_KEY_HEADING}\n\nFor more information about rotating a leaked key, see [Rotate API keys](/docs/guides/api/rotate-keys).\n\n`
      ),
    })

    expect(broken).toEqual([])
  })

  it('passes when the same change updates every link', async () => {
    const broken = await checkRealContent({
      [API_KEYS]: replaceOrThrow(section(LEAKED_KEY_HEADING), ''),
      [LEAKED_KEY_LINKER]: replaceOrThrow(
        '/docs/guides/getting-started/api-keys#leaked-key',
        '/docs/guides/api/rotate-keys'
      ),
    })

    expect(broken).toEqual([])
  })

  it('fails when a heading is removed from a nested partial', async () => {
    const page = `${CONTENT}guides/example.mdx`
    const linker = `${CONTENT}troubleshooting/example.mdx`
    const outer = `${CONTENT}_partials/outer.mdx`
    const inner = `${CONTENT}_partials/inner.mdx`
    const shared = {
      [page]: '<$Partial path="outer.mdx" variables={{ "name": "Shared" }} />\n',
      [outer]: '<$Partial path="inner.mdx" variables={{ "name": "{{ .name }}" }} />\n',
      [linker]: '[Shared section](/docs/guides/example#shared-section)\n',
    }
    const base: Record<string, string> = {
      ...shared,
      [inner]: '## {{ .name }} section\n',
    }
    const head: Record<string, string> = { ...shared, [inner]: '## Other section\n' }

    expect(await checkFixtures(base, head)).toEqual([
      {
        page,
        route: '/guides/example',
        anchor: 'shared-section',
        linkedFrom: [{ file: linker, line: 1 }],
      },
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
