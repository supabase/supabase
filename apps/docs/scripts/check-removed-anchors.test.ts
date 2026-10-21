import { join } from 'node:path'
import type { Heading } from 'mdast'
import { describe, expect, it } from 'vitest'

import {
  findBrokenAnchors,
  findInWorkingTree,
  hasBypassLabel,
  headingAnchor,
  parseLinkTarget,
  readFromWorkingTree,
  type FindFiles,
  type ReadContent,
} from './check-removed-anchors'

const CONTENT_DIR = join(import.meta.dirname, '..', 'content')
const API_KEYS = 'guides/getting-started/api-keys.mdx'
const GOING_INTO_PROD = 'guides/deployment/going-into-prod.mdx'

const readBase = readFromWorkingTree(CONTENT_DIR)

/** Runs the check against real content, with `edits` applied to the head revision. */
async function checkRealContent(edits: Record<string, (source: string) => string>) {
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

/** Removes a section's heading line and body, up to the next heading of any level. */
const removeSection = (heading: string) =>
  replaceOrThrow(new RegExp(`^${escapeRegExp(heading)}\\n[\\s\\S]*?(?=^#{2,3} )`, 'm'), '')

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Runs the check against in-memory fixtures. */
function checkFixtures(base: Record<string, string>, head: Record<string, string>) {
  const changedFiles = Object.keys({ ...base, ...head }).filter((file) => base[file] !== head[file])
  const findFiles: FindFiles = async (needle) =>
    Object.keys(head).filter((file) => head[file].includes(needle))
  return findBrokenAnchors({
    changedFiles,
    readBase: async (file) => base[file],
    readHead: async (file) => head[file],
    findFiles,
  })
}

describe('findBrokenAnchors on real content', () => {
  it('fails when a linked heading with a custom id is removed', async () => {
    const broken = await checkRealContent({
      [API_KEYS]: removeSection('### Rotate a leaked or compromised key [#leaked-key]'),
    })

    expect(broken).toEqual([
      expect.objectContaining({
        route: '/guides/getting-started/api-keys',
        anchor: 'leaked-key',
        linkedFrom: [
          expect.objectContaining({
            file: 'troubleshooting/rotating-anon-service-and-jwt-secrets-1Jq6yd.mdx',
          }),
        ],
      }),
    ])
  })

  it('matches on the custom id, not the heading text', async () => {
    const broken = await checkRealContent({
      [API_KEYS]: replaceOrThrow(
        '### Rotate a leaked or compromised key [#leaked-key]',
        '### Rotate a leaked or compromised key'
      ),
    })

    expect(broken.map(({ anchor }) => anchor)).toEqual(['leaked-key'])
  })

  it('fails for each of the four linked going-into-prod anchors', async () => {
    const broken = await checkRealContent({
      [GOING_INTO_PROD]: (source) =>
        [
          '## Security',
          '## Performance',
          '## Rate limiting, resource allocation, & abuse prevention',
          '### Auth rate limits',
        ].reduce((result, heading) => removeSection(heading)(result), source),
    })

    expect(broken.map(({ anchor }) => anchor).sort()).toEqual([
      'auth-rate-limits',
      'performance',
      'rate-limiting-resource-allocation--abuse-prevention',
      'security',
    ])
    for (const { anchor, linkedFrom } of broken) {
      expect(linkedFrom.length, anchor).toBeGreaterThan(0)
    }
  })

  it('counts same-page links', async () => {
    const broken = await checkRealContent({
      [GOING_INTO_PROD]: removeSection('## Availability'),
    })

    expect(broken).toEqual([
      expect.objectContaining({
        anchor: 'availability',
        linkedFrom: [expect.objectContaining({ file: GOING_INTO_PROD, line: 11 })],
      }),
    ])
  })

  it('passes when the heading stays with a summary and a link', async () => {
    const broken = await checkRealContent({
      [API_KEYS]: replaceOrThrow(
        /(### Rotate a leaked or compromised key \[#leaked-key\]\n)[\s\S]*?(?=^#{2,3} |$(?![\s\S]))/m,
        '$1\nThis moved to [Rotate API keys](/docs/guides/api/rotate-keys).\n\n'
      ),
    })

    expect(broken).toEqual([])
  })

  it('passes when a renamed heading keeps the old anchor', async () => {
    const broken = await checkRealContent({
      [GOING_INTO_PROD]: replaceOrThrow('## Security\n', '## Security checklist [#security]\n'),
    })

    expect(broken).toEqual([])
  })

  it('passes when a removed heading has no links', async () => {
    const broken = await checkRealContent({
      [GOING_INTO_PROD]: removeSection('## Deployment'),
    })

    expect(broken).toEqual([])
  })

  it('passes when the same change updates every link', async () => {
    const broken = await checkRealContent({
      [API_KEYS]: removeSection('### Rotate a leaked or compromised key [#leaked-key]'),
      'troubleshooting/rotating-anon-service-and-jwt-secrets-1Jq6yd.mdx': replaceOrThrow(
        '/docs/guides/getting-started/api-keys#leaked-key',
        '/docs/guides/api/rotate-keys'
      ),
    })

    expect(broken).toEqual([])
  })
})

describe('findBrokenAnchors on fixtures', () => {
  const page = 'guides/example.mdx'
  const linker = 'troubleshooting/example.mdx'
  const links =
    '[a](/guides/example#shared-section)\n\n<Link href="/docs/guides/example#shared-section">b</Link>\n'

  it('fails when a heading is removed from a partial, naming each link', async () => {
    const pageSource = '# Example\n\n<$Partial path="shared.mdx" />\n'
    const broken = await checkFixtures(
      { [page]: pageSource, '_partials/shared.mdx': '## Shared section\n', [linker]: links },
      { [page]: pageSource, '_partials/shared.mdx': 'No heading here.\n', [linker]: links }
    )

    expect(broken).toEqual([
      {
        page,
        route: '/guides/example',
        anchor: 'shared-section',
        linkedFrom: [
          { file: linker, line: 1 },
          { file: linker, line: 3 },
        ],
      },
    ])
  })

  it('follows nested partials and substitutes variables', async () => {
    const pageSource = '<$Partial path="outer.mdx" variables={{ "name": "Shared" }} />\n'
    const outer = '<$Partial path="inner.mdx" variables={{ "name": "{{ .name }}" }} />\n'
    const broken = await checkFixtures(
      {
        [page]: pageSource,
        '_partials/outer.mdx': outer,
        '_partials/inner.mdx': '## {{ .name }} section\n',
        [linker]: links,
      },
      {
        [page]: pageSource,
        '_partials/outer.mdx': outer,
        '_partials/inner.mdx': '## Other section\n',
        [linker]: links,
      }
    )

    expect(broken.map(({ anchor }) => anchor)).toEqual(['shared-section'])
  })

  it('ignores deleted pages', async () => {
    const broken = await checkFixtures(
      { [page]: '## Shared section\n', [linker]: links },
      { [linker]: links }
    )

    expect(broken).toEqual([])
  })
})

describe('headingAnchor', () => {
  const heading = (children: Heading['children']): Heading => ({
    type: 'heading',
    depth: 2,
    children,
  })

  it.each([
    [
      heading([{ type: 'text', value: 'Rate limiting, resource allocation, & abuse prevention' }]),
      'rate-limiting-resource-allocation--abuse-prevention',
    ],
    [heading([{ type: 'text', value: 'Rotate a key [#leaked-key]' }]), 'leaked-key'],
    [
      heading([
        { type: 'text', value: 'Legacy ' },
        { type: 'inlineCode', value: 'anon' },
        { type: 'text', value: ' and ' },
        { type: 'inlineCode', value: 'service_role' },
        { type: 'text', value: ' keys' },
      ]),
      'legacy-anon-and-servicerole-keys',
    ],
  ])('matches the rendered heading id', (node, expected) => {
    expect(headingAnchor(node)).toBe(expected)
  })
})

describe('parseLinkTarget', () => {
  it.each([
    ['/guides/a/b#c', undefined, { route: '/guides/a/b', anchor: 'c' }],
    ['/docs/guides/a/b#c', undefined, { route: '/guides/a/b', anchor: 'c' }],
    ['https://supabase.com/docs/guides/a/b/#c', undefined, { route: '/guides/a/b', anchor: 'c' }],
    ['/guides/a/b?x=1#c', undefined, { route: '/guides/a/b', anchor: 'c' }],
    ['#c', '/guides/a/b', { route: '/guides/a/b', anchor: 'c' }],
    ['#c', undefined, undefined],
    ['/guides/a/b', undefined, undefined],
    ['/reference/javascript#c', undefined, undefined],
    ['https://example.com/docs/guides/a#c', undefined, undefined],
  ])('parses %s', (url, ownRoute, expected) => {
    expect(parseLinkTarget(url, ownRoute)).toEqual(expected)
  })
})

describe('hasBypassLabel', () => {
  it('passes a PR with the bypass label', () => {
    expect(hasBypassLabel('["documentation","skip-anchor-check"]')).toBe(true)
  })

  it('fails a PR without it', () => {
    expect(hasBypassLabel('["documentation"]')).toBe(false)
    expect(hasBypassLabel('[]')).toBe(false)
    expect(hasBypassLabel(undefined)).toBe(false)
  })
})
