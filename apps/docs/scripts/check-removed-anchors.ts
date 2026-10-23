/**
 * Leaves a trail when sections move. Agents are slow to update what they
 * remember about the docs, so this fails a PR that removes a section another
 * page links to, unless the heading stays with a summary and a link to where
 * the content went. The `skip-anchor-check` label allows a deliberate removal.
 */

import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { promisify } from 'node:util'
import {
  fromDocsMarkdown,
  getAttributeValue,
  getAttributeValueExpression,
} from '~/features/directives/utils.server'
import { parsePartialVariables, substitutePartialVars } from '~/lib/partials.utils'
import type { Heading, Parent, Root } from 'mdast'
import type { MdxJsxFlowElement } from 'mdast-util-mdx-jsx'
import { toString } from 'mdast-util-to-string'
import { getAnchor } from 'ui/src/components/CustomHTMLElements/CustomHTMLElements.utils'
import { visit } from 'unist-util-visit'

export type ReadContent = (path: string) => Promise<string | undefined>

export type FindFiles = (needle: string) => Promise<string[]>

export interface LinkLocation {
  file: string
  line: number
}

export interface BrokenAnchor {
  page: string
  route: string
  anchor: string
  linkedFrom: LinkLocation[]
}

export interface CheckOptions {
  changedFiles: string[]
  readBase: ReadContent
  readHead: ReadContent
  findFiles: FindFiles
}

const BYPASS_LABEL = 'skip-anchor-check'

const CONTENT_PREFIX = 'apps/docs/content/'
const GUIDES_PREFIX = `${CONTENT_PREFIX}guides/`
const PARTIALS_PREFIX = `${CONTENT_PREFIX}_partials/`
const MAX_PARTIAL_DEPTH = 10

const isMarkdown = (path: string) => /\.mdx?$/.test(path)
const isGuidePage = (path: string) => path.startsWith(GUIDES_PREFIX) && isMarkdown(path)
const isPartial = (path: string) => path.startsWith(PARTIALS_PREFIX) && isMarkdown(path)

const toRoute = (guidePath: string) =>
  `/${guidePath.slice(CONTENT_PREFIX.length).replace(/\.mdx?$/, '')}`

export async function findBrokenAnchors({
  changedFiles,
  readBase,
  readHead,
  findFiles,
}: CheckOptions): Promise<BrokenAnchor[]> {
  const pages = await findAffectedPages(changedFiles, findFiles)

  const removedByPage = new Map<string, string[]>()
  for (const page of pages) {
    const [baseAnchors, headAnchors] = await Promise.all([
      collectAnchors(page, readBase),
      collectAnchors(page, readHead),
    ])
    if (!baseAnchors || !headAnchors) continue

    const removed = [...baseAnchors].filter((anchor) => !headAnchors.has(anchor))
    if (removed.length > 0) removedByPage.set(page, removed)
  }

  const broken: BrokenAnchor[] = []
  for (const [page, anchors] of removedByPage) {
    const route = toRoute(page)
    const linkers = await findFiles(route)
    const links = (
      await Promise.all([
        collectSamePageLinks(page, readHead),
        ...linkers.map((file) => collectLinksTo(route, file, readHead)),
      ])
    ).flat()

    for (const anchor of anchors) {
      const linkedFrom = links
        .filter((link) => link.route === route && link.anchor === anchor)
        .map(({ file, line }) => ({ file, line }))
      if (linkedFrom.length > 0) broken.push({ page, route, anchor, linkedFrom })
    }
  }

  return broken
}

async function findAffectedPages(changedFiles: string[], findFiles: FindFiles) {
  const pages = new Set(changedFiles.filter((file) => isGuidePage(file)))
  const queue = changedFiles.filter((file) => isPartial(file))
  const seen = new Set(queue)

  while (queue.length > 0) {
    const partial = queue.pop()!
    for (const file of await findFiles(partial.slice(PARTIALS_PREFIX.length))) {
      if (isGuidePage(file)) {
        pages.add(file)
      } else if (isPartial(file) && !seen.has(file)) {
        seen.add(file)
        queue.push(file)
      }
    }
  }

  return [...pages]
}

function parseMdx(source: string): Root {
  const withoutFrontmatter = source.replace(/^---\r?\n[\s\S]*?\r?\n---(?=\r?\n|$)/, (match) =>
    match.replace(/[^\n]/g, '')
  )
  return fromDocsMarkdown(withoutFrontmatter)
}

async function collectAnchors(page: string, read: ReadContent) {
  const source = await read(page)
  if (source === undefined) return undefined

  const tree = parseMdx(source)
  await expandPartials(tree, read)

  const anchors = new Set<string>()
  visit(tree, 'heading', (node: Heading) => {
    if (node.depth !== 2 && node.depth !== 3) return
    const anchor = headingAnchor(node)
    if (anchor) anchors.add(anchor)
  })
  return anchors
}

function headingAnchor(node: Heading) {
  const children = node.children.map((child) =>
    child.type === 'text' ? child.value : { props: { children: toString(child) } }
  )
  return getAnchor(children.length === 1 ? children[0] : children)
}

async function expandPartials(tree: Root, read: ReadContent) {
  for (let depth = 0; depth < MAX_PARTIAL_DEPTH; depth++) {
    const includes: [Parent, MdxJsxFlowElement][] = []
    visit(tree, 'mdxJsxFlowElement', (node: MdxJsxFlowElement, _index, parent) => {
      if (node.name === '$Partial' && parent) includes.push([parent, node])
    })
    if (includes.length === 0) return

    for (const [parent, node] of includes) {
      const path = getAttributeValue(node, 'path')
      const source =
        typeof path === 'string'
          ? await read(`${PARTIALS_PREFIX}${path.replace(/^\//, '')}`)
          : undefined
      const variables = parsePartialVariables(
        getAttributeValueExpression(getAttributeValue(node, 'variables'))
      )
      const replacement =
        source === undefined
          ? []
          : parseMdx(substitutePartialVars(source.trim(), variables)).children
      parent.children.splice(parent.children.indexOf(node), 1, ...replacement)
    }
  }
}

interface Link extends LinkLocation {
  route: string
  anchor: string
}

async function collectSamePageLinks(page: string, read: ReadContent): Promise<Link[]> {
  const source = await read(page)
  if (source === undefined) return []

  const route = toRoute(page)
  const links: Link[] = []
  visit(parseMdx(source), (node) => {
    const url =
      node.type === 'link' || node.type === 'definition'
        ? node.url
        : node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement'
          ? getAttributeValue(node, 'href')
          : undefined
    if (typeof url === 'string' && url.startsWith('#') && url.length > 1) {
      links.push({ route, anchor: url.slice(1), file: page, line: node.position?.start.line ?? 0 })
    }
  })
  return links
}

async function collectLinksTo(route: string, file: string, read: ReadContent): Promise<Link[]> {
  const source = await read(file)
  if (source === undefined) return []

  const escapedRoute = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`${escapedRoute}/?(?:\\?[^#\\s'"\`)]*)?#([A-Za-z0-9_-]+)`, 'g')
  return source.split('\n').flatMap((text, index) =>
    [...text.matchAll(pattern)].map((match) => ({
      route,
      anchor: match[1],
      file,
      line: index + 1,
    }))
  )
}

function formatReport(broken: BrokenAnchor[]) {
  const lines = [
    `This change removes ${broken.length} linked section anchor${broken.length === 1 ? '' : 's'}.`,
    'Agents are slow to update what they remember about the docs, so they keep following',
    'old links after a section moves. Leave a trail so they still land on the answer.',
    '',
  ]
  for (const { route, anchor, linkedFrom } of broken) {
    lines.push(`${route}#${anchor} is linked from:`)
    for (const { file, line } of linkedFrom) lines.push(`  - ${file}:${line}`)
    lines.push('')
  }
  lines.push(
    'To fix, do both:',
    "  1. Point the links above to the content's new home.",
    '  2. Keep the heading and replace its body with a cross-reference to that new home:',
    '',
    '       ### Rotate a leaked or compromised key [#leaked-key]',
    '',
    '       For more information about rotating a leaked key, see [Rotate API keys](/docs/guides/api/rotate-keys).',
    '',
    'Renamed the heading? Keep the old anchor: `## New title [#old-anchor]`.',
    `To merge anyway, add the \`${BYPASS_LABEL}\` label. See apps/docs/CONTRIBUTING.md.`
  )
  return lines.join('\n')
}

export function hasBypassLabel(labelsJson: string | undefined) {
  if (!labelsJson) return false
  try {
    const labels: unknown = JSON.parse(labelsJson)
    return Array.isArray(labels) && labels.includes(BYPASS_LABEL)
  } catch {
    return false
  }
}

const execFileAsync = promisify(execFile)

async function git(args: string[], cwd: string) {
  const { stdout } = await execFileAsync('git', args, { cwd, maxBuffer: 64 * 1024 * 1024 })
  return stdout
}

export function readFromWorkingTree(repoRoot: string): ReadContent {
  return async (path) => {
    try {
      return await readFile(join(repoRoot, path), 'utf-8')
    } catch {
      return undefined
    }
  }
}

const SEARCH_PATHSPEC = [
  '*.md',
  '*.mdx',
  '*.ts',
  '*.tsx',
  '*.js',
  '*.jsx',
  '*.mjs',
  '*.json',
  '*.astro',
  '*.yml',
  '*.yaml',
  ':!**/*.test.*',
  ':!**/*.spec.*',
  ':!**/__snapshots__/**',
  ':!**/__generated__/**',
  ':!**/.generated/**',
  ':!apps/docs/features/docs/generated/**',
]

export function findInWorkingTree(repoRoot: string): FindFiles {
  return async (needle) => {
    try {
      const stdout = await git(
        ['grep', '-l', '-F', '--untracked', '-e', needle, '--', ...SEARCH_PATHSPEC],
        repoRoot
      )
      return stdout.split('\n').filter(Boolean)
    } catch {
      return []
    }
  }
}

async function main() {
  const baseArgIndex = process.argv.indexOf('--base')
  const repoRoot = (await git(['rev-parse', '--show-toplevel'], import.meta.dirname)).trim()
  const base =
    baseArgIndex === -1
      ? (await git(['merge-base', 'origin/master', 'HEAD'], repoRoot)).trim()
      : process.argv[baseArgIndex + 1]

  const changedFiles = (
    await git(['diff', '--name-only', '--no-renames', base, '--', CONTENT_PREFIX], repoRoot)
  )
    .split('\n')
    .filter(Boolean)

  if (changedFiles.length === 0) {
    console.log('No docs content changed.')
    return
  }

  const broken = await findBrokenAnchors({
    changedFiles,
    readBase: async (path) => {
      try {
        return await git(['show', `${base}:${path}`], repoRoot)
      } catch {
        return undefined
      }
    },
    readHead: readFromWorkingTree(repoRoot),
    findFiles: findInWorkingTree(repoRoot),
  })

  if (broken.length === 0) {
    console.log('No linked section anchors were removed.')
    return
  }

  // eslint-disable-next-line turbo/no-undeclared-env-vars
  const bypassed = hasBypassLabel(process.env.PR_LABELS)
  if (process.env.GITHUB_ACTIONS) {
    const level = bypassed ? 'warning' : 'error'
    for (const { route, anchor, linkedFrom } of broken) {
      for (const { file, line } of linkedFrom) {
        console.log(
          `::${level} file=${file},line=${line}::Links to ${route}#${anchor}, which this PR removes`
        )
      }
    }
  }
  console.error(formatReport(broken))

  if (bypassed) {
    console.log(`\nPassing anyway: the PR has the \`${BYPASS_LABEL}\` label.`)
  } else {
    process.exitCode = 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
