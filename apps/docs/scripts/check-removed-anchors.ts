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

export type ReadContent = (contentPath: string) => Promise<string | undefined>

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

const PARTIALS_PREFIX = '_partials/'
const MAX_PARTIAL_DEPTH = 10

const isMarkdown = (contentPath: string) => /\.mdx?$/.test(contentPath)
const isGuidePage = (contentPath: string) =>
  contentPath.startsWith('guides/') && isMarkdown(contentPath)
const isPartial = (contentPath: string) =>
  contentPath.startsWith(PARTIALS_PREFIX) && isMarkdown(contentPath)

const toRoute = (guidePath: string) => `/${guidePath.replace(/\.mdx?$/, '')}`

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
    const linkers = new Set(await findFiles(`${route}#`))
    linkers.add(page)

    const links = (
      await Promise.all([...linkers].map((file) => collectLinks(file, readHead)))
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

async function collectLinks(file: string, read: ReadContent): Promise<Link[]> {
  const source = await read(file)
  if (source === undefined) return []

  const ownRoute = isGuidePage(file) ? toRoute(file) : undefined
  const links: Link[] = []
  const add = (url: unknown, line: number | undefined) => {
    if (typeof url !== 'string') return
    const target = parseLinkTarget(url, ownRoute)
    if (target) links.push({ ...target, file, line: line ?? 0 })
  }

  const tree = parseMdx(isPartial(file) ? substitutePartialVars(source, undefined) : source)
  visit(tree, (node) => {
    const line = node.position?.start.line
    if (node.type === 'link' || node.type === 'definition') {
      add(node.url, line)
    } else if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
      add(getAttributeValue(node, 'href'), line)
    }
  })

  return links
}

function parseLinkTarget(url: string, ownRoute?: string) {
  const hashIndex = url.indexOf('#')
  if (hashIndex === -1) return undefined

  const anchor = url.slice(hashIndex + 1)
  const path = url
    .slice(0, hashIndex)
    .split('?')[0]
    .replace(/^https?:\/\/(www\.)?supabase\.com(?=\/)/, '')
    .replace(/^\/docs(?=\/)/, '')
    .replace(/\/$/, '')

  if (path === '') return ownRoute && anchor ? { route: ownRoute, anchor } : undefined
  if (!path.startsWith('/guides/') || !anchor) return undefined
  return { route: path, anchor }
}

function formatReport(broken: BrokenAnchor[]) {
  const lines = [
    `This change removes ${broken.length} linked section anchor${broken.length === 1 ? '' : 's'}:`,
    '',
  ]
  for (const { route, anchor, linkedFrom } of broken) {
    lines.push(`${route}#${anchor} is linked from:`)
    for (const { file, line } of linkedFrom) lines.push(`  - ${file}:${line}`)
    lines.push('')
  }
  lines.push(
    'To fix, do one of these:',
    '  - Keep the heading. Replace its body with a short summary and a link to where the content went.',
    '  - If you renamed the heading, keep the old anchor: `## New title [#old-anchor]`.',
    '  - Update the links listed above to point somewhere else.',
    `  - If the removal is deliberate, add the \`${BYPASS_LABEL}\` label to the PR.`
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

export function readFromWorkingTree(contentDir: string): ReadContent {
  return async (contentPath) => {
    try {
      return await readFile(join(contentDir, contentPath), 'utf-8')
    } catch {
      return undefined
    }
  }
}

export function findInWorkingTree(contentDir: string): FindFiles {
  return async (needle) => {
    try {
      const stdout = await git(
        ['grep', '-l', '-F', '--untracked', '-e', needle, '--', '.'],
        contentDir
      )
      return stdout.split('\n').filter(Boolean)
    } catch {
      return []
    }
  }
}

async function main() {
  const baseArgIndex = process.argv.indexOf('--base')
  const contentDir = join(import.meta.dirname, '..', 'content')
  const repoRoot = (await git(['rev-parse', '--show-toplevel'], contentDir)).trim()
  const contentPrefix = (await git(['rev-parse', '--show-prefix'], contentDir)).trim()
  const base =
    baseArgIndex === -1
      ? (await git(['merge-base', 'origin/master', 'HEAD'], repoRoot)).trim()
      : process.argv[baseArgIndex + 1]

  const changedFiles = (
    await git(['diff', '--name-only', '--no-renames', base, '--', contentPrefix], repoRoot)
  )
    .split('\n')
    .filter(Boolean)
    .map((file) => file.slice(contentPrefix.length))

  if (changedFiles.length === 0) {
    console.log('No docs content changed.')
    return
  }

  const broken = await findBrokenAnchors({
    changedFiles,
    readBase: async (contentPath) => {
      try {
        return await git(['show', `${base}:${contentPrefix}${contentPath}`], repoRoot)
      } catch {
        return undefined
      }
    },
    readHead: readFromWorkingTree(contentDir),
    findFiles: findInWorkingTree(contentDir),
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
          `::${level} file=${contentPrefix}${file},line=${line}::Links to ${route}#${anchor}, which this PR removes`
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
