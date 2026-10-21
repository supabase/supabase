import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  findBrokenAnchors,
  findInWorkingTree,
  hasBypassLabel,
  readFromWorkingTree,
  type ReadContent,
} from './check-removed-anchors'

const CONTENT_DIR = join(import.meta.dirname, '..', 'content')
const API_KEYS = 'guides/getting-started/api-keys.mdx'
const GOING_INTO_PROD = 'guides/deployment/going-into-prod.mdx'
const LEAKED_KEY_HEADING = '### Rotate a leaked or compromised key [#leaked-key]'

const readBase = readFromWorkingTree(CONTENT_DIR)

/** Runs the check against real content, with `edits` applied to the head revision. */
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
    findFiles: findInWorkingTree(CONTENT_DIR),
  })
}

const replaceOrThrow = (search: string | RegExp, replacement: string) => (source: string) => {
  const result = source.replace(search, replacement)
  if (result === source) throw new Error(`Test fixture is stale: ${search} not found`)
  return result
}

/** Matches a section from its heading up to the next H2 or H3, or the end of the file. */
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
        linkedFrom: [
          { file: 'troubleshooting/rotating-anon-service-and-jwt-secrets-1Jq6yd.mdx', line: 39 },
        ],
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

  it('passes when the heading stays with a summary and a link', async () => {
    const broken = await checkRealContent({
      [API_KEYS]: replaceOrThrow(
        section(LEAKED_KEY_HEADING),
        `${LEAKED_KEY_HEADING}\n\nThis moved to [Rotate API keys](/docs/guides/api/rotate-keys).\n\n`
      ),
    })

    expect(broken).toEqual([])
  })

  it('passes when the same change updates every link', async () => {
    const broken = await checkRealContent({
      [API_KEYS]: replaceOrThrow(section(LEAKED_KEY_HEADING), ''),
      'troubleshooting/rotating-anon-service-and-jwt-secrets-1Jq6yd.mdx': replaceOrThrow(
        '/docs/guides/getting-started/api-keys#leaked-key',
        '/docs/guides/api/rotate-keys'
      ),
    })

    expect(broken).toEqual([])
  })

  it('fails when a heading is removed from a nested partial', async () => {
    const page = 'guides/example.mdx'
    const linker = 'troubleshooting/example.mdx'
    const shared = {
      [page]: '<$Partial path="outer.mdx" variables={{ "name": "Shared" }} />\n',
      '_partials/outer.mdx':
        '<$Partial path="inner.mdx" variables={{ "name": "{{ .name }}" }} />\n',
      [linker]: '[Shared section](/docs/guides/example#shared-section)\n',
    }
    const base: Record<string, string> = {
      ...shared,
      '_partials/inner.mdx': '## {{ .name }} section\n',
    }
    const head: Record<string, string> = { ...shared, '_partials/inner.mdx': '## Other section\n' }

    const broken = await findBrokenAnchors({
      changedFiles: ['_partials/inner.mdx'],
      readBase: async (file) => base[file],
      readHead: async (file) => head[file],
      findFiles: async (needle) => Object.keys(head).filter((file) => head[file].includes(needle)),
    })

    expect(broken).toEqual([
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
