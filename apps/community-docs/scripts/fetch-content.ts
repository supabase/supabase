import { execFile } from 'node:child_process'
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, extname, join, posix, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

import {
  communityResourceNames,
  getGitHubResourceSource,
  getGitHubResourceUrl,
  type GitHubResourceSource,
} from '../lib/community-resources'

const execFileAsync = promisify(execFile)

const COMMUNITY_ORG = 'supabase-community'
const appDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const contentDirectory = join(appDirectory, 'content')
const maxBuffer = 1024 * 1024 * 50

type RepoListItem = {
  name: string
  url: string
  description?: string | null
}

type RepoDetails = {
  default_branch: string
  description?: string | null
  forks_count?: number
  html_url: string
  is_template?: boolean
  language?: string | null
  name: string
  stargazers_count?: number
  topics?: string[]
}

type TreeResponse = {
  tree?: TreeItem[]
}

type TreeItem = {
  path?: string
  type?: string
}

type ContentResponse = {
  content?: string
  encoding?: string
}

type SourceDocument = {
  label: string
  content: string
}

type GeneratedDoc = {
  title: string
  description: string
  repo: string
  repoUrl: string
  stars: number
  forks: number
  language?: string
  isTemplate: boolean
  tags: string[]
  category: string
  content: string
}

const headingPattern = /^(#{1,3})\s+(Getting Started|Quickstart|Installation|Usage)\b.*$/gim

const categoryKeywords = [
  { category: 'Auth', keywords: ['auth', 'oauth', 'jwt', 'session', 'login', 'identity'] },
  { category: 'Storage', keywords: ['storage', 'bucket', 'file', 'upload', 's3'] },
  { category: 'Realtime', keywords: ['realtime', 'broadcast', 'presence', 'channel'] },
  { category: 'Database', keywords: ['database', 'postgres', 'postgresql', 'sql', 'pg', 'vector'] },
  {
    category: 'Edge Functions',
    keywords: ['edge function', 'edge-functions', 'function', 'deno', 'serverless'],
  },
]

const tagKeywords = [
  'auth',
  'storage',
  'realtime',
  'database',
  'postgres',
  'functions',
  'edge-functions',
  'nextjs',
  'react',
  'vue',
  'svelte',
  'flutter',
  'kotlin',
  'swift',
  'python',
  'expo',
  'stripe',
]
const docsEntryFilenames = [
  'README.md',
  'README.mdx',
  'readme.md',
  'readme.mdx',
  'index.md',
  'index.mdx',
] as const
const maxLinkedDocumentDepth = 2

async function gh<T>(args: string[]): Promise<T> {
  const token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN
  const env = token ? { ...process.env, GH_TOKEN: token } : process.env
  const { stdout } = await execFileAsync('gh', args, { env, maxBuffer })

  return JSON.parse(stdout) as T
}

async function ghText(args: string[]): Promise<string> {
  const token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN
  const env = token ? { ...process.env, GH_TOKEN: token } : process.env
  const { stdout } = await execFileAsync('gh', args, { env, maxBuffer })

  return stdout
}

async function maybeGh<T>(args: string[]): Promise<T | undefined> {
  try {
    return await gh<T>(args)
  } catch (error) {
    console.warn(`Skipping failed gh command: gh ${args.join(' ')}`)
    if (error instanceof Error) console.warn(error.message)
    return undefined
  }
}

function decodeBase64Content(response?: ContentResponse): string | undefined {
  if (!response?.content || response.encoding !== 'base64') return undefined

  return Buffer.from(response.content.replace(/\s/g, ''), 'base64').toString('utf-8')
}

async function listRepos(): Promise<RepoListItem[]> {
  return gh<RepoListItem[]>([
    'repo',
    'list',
    COMMUNITY_ORG,
    '--visibility=public',
    '--limit=1000',
    '--json',
    'name,url,description',
  ])
}

async function getRepoDetails(source: GitHubResourceSource): Promise<RepoDetails | undefined> {
  return maybeGh<RepoDetails>(['api', `repos/${source.owner}/${source.repo}`])
}

function encodeGitHubPath(path: string): string {
  return path.split('/').map(encodeURIComponent).join('/')
}

function joinGitHubPath(...segments: Array<string | undefined>): string {
  return segments
    .filter((segment): segment is string => Boolean(segment))
    .map((segment) => segment.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/')
}

async function getRepositoryTree(
  source: GitHubResourceSource,
  branch: string
): Promise<TreeItem[]> {
  const response = await maybeGh<TreeResponse>([
    'api',
    `repos/${source.owner}/${source.repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
  ])

  return response?.tree ?? []
}

function isMarkdownPath(path: string) {
  return ['.md', '.mdx'].includes(extname(path).toLowerCase())
}

function isBlobPath(tree: TreeItem[], path: string) {
  return tree.some((item) => item.type === 'blob' && item.path === path)
}

function isTreePath(tree: TreeItem[], path: string) {
  return tree.some((item) => item.type === 'tree' && item.path === path)
}

function getSourceRoot(source: GitHubResourceSource) {
  return joinGitHubPath(source.path)
}

function isWithinSourceRoot(path: string, sourceRoot: string) {
  return !sourceRoot || path === sourceRoot || path.startsWith(`${sourceRoot}/`)
}

function getInitialDocumentPaths(tree: TreeItem[], source: GitHubResourceSource): string[] {
  const sourceRoot = getSourceRoot(source)
  const rootReadmes = docsEntryFilenames
    .map((filename) => joinGitHubPath(sourceRoot, filename))
    .filter((path) => isBlobPath(tree, path))
  const docsRoot = joinGitHubPath(sourceRoot, 'docs')
  const docsFiles = tree
    .map((item) => item.path)
    .filter((path): path is string => Boolean(path))
    .filter((path) => isMarkdownPath(path))
    .filter((path) => path.startsWith(`${docsRoot}/`))
    .sort()

  return [...new Set([...rootReadmes, ...docsFiles])]
}

function decodeMarkdownLinkTarget(target: string) {
  const [pathWithoutHash] = target.split('#')
  const [pathWithoutQuery] = pathWithoutHash.split('?')

  try {
    return decodeURIComponent(pathWithoutQuery)
  } catch {
    return pathWithoutQuery
  }
}

function isRelativeLinkTarget(target: string) {
  return Boolean(target) && !target.startsWith('#') && !target.startsWith('/') && !/^[a-z][a-z0-9+.-]*:/i.test(target)
}

function extractRelativeMarkdownLinks(source: string): string[] {
  const markdownLinks = [...source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((match) => match[1])
  const referenceLinks = [...source.matchAll(/^\[[^\]]+\]:\s+(\S+)/gm)].map((match) => match[1])

  return [...markdownLinks, ...referenceLinks]
    .map((target) => target.trim().replace(/^<|>$/g, ''))
    .filter(isRelativeLinkTarget)
    .map(decodeMarkdownLinkTarget)
    .filter(Boolean)
}

function resolveLinkedDocumentPaths(
  tree: TreeItem[],
  source: GitHubResourceSource,
  fromPath: string,
  target: string
): string[] {
  const sourceRoot = getSourceRoot(source)
  const resolved = posix.normalize(posix.join(posix.dirname(fromPath), target))

  if (resolved.startsWith('../') || !isWithinSourceRoot(resolved, sourceRoot)) return []

  if (isMarkdownPath(resolved) && isBlobPath(tree, resolved)) return [resolved]

  if (!isTreePath(tree, resolved)) return []

  return docsEntryFilenames
    .map((filename) => joinGitHubPath(resolved, filename))
    .filter((path) => isBlobPath(tree, path))
}

async function getMarkdownContent(
  source: GitHubResourceSource,
  branch: string,
  path: string
): Promise<string | undefined> {
  const response = await maybeGh<ContentResponse>([
    'api',
    `repos/${source.owner}/${source.repo}/contents/${encodeGitHubPath(path)}?ref=${encodeURIComponent(branch)}`,
  ])

  return decodeBase64Content(response)
}

async function discoverSourceDocuments(
  source: GitHubResourceSource,
  branch: string,
  tree: TreeItem[]
): Promise<SourceDocument[]> {
  const documents: SourceDocument[] = []
  const visited = new Set<string>()
  const queue = getInitialDocumentPaths(tree, source).map((path) => ({ depth: 0, path }))

  for (let index = 0; index < queue.length; index++) {
    const { depth, path } = queue[index]

    if (visited.has(path)) continue
    visited.add(path)

    const content = await getMarkdownContent(source, branch, path)

    if (!content) continue

    documents.push({ label: path, content })

    if (depth >= maxLinkedDocumentDepth) continue

    for (const target of extractRelativeMarkdownLinks(content)) {
      for (const linkedPath of resolveLinkedDocumentPaths(tree, source, path, target)) {
        if (!visited.has(linkedPath)) queue.push({ depth: depth + 1, path: linkedPath })
      }
    }
  }

  return documents
}

function extractGettingStartedSections(source: string): string[] {
  const matches = [...source.matchAll(headingPattern)]
  const sections: string[] = []

  for (const match of matches) {
    const start = match.index ?? 0
    const level = match[1].length
    const rest = source.slice(start + match[0].length)
    const nextHeading = new RegExp(`^#{1,${level}}\\s+`, 'im').exec(rest)
    const end =
      nextHeading?.index === undefined ? source.length : start + match[0].length + nextHeading.index
    const section = source.slice(start, end).trim()

    if (section) sections.push(section)
  }

  return sections
}

function extractFirstParagraph(source: string): string | undefined {
  const paragraph = source
    .replace(/^---[\s\S]*?---/, '')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .find(
      (block) =>
        block && !block.startsWith('#') && !block.startsWith('![') && !block.startsWith('[')
    )

  return paragraph?.replace(/\s+/g, ' ').slice(0, 180)
}

function humanizeRepoName(name: string): string {
  return name
    .replace(/^supabase[-_]/, '')
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function resolveContentPath(...segments: string[]) {
  const fullPath = resolve(contentDirectory, ...segments)

  if (!fullPath.startsWith(`${contentDirectory}${sep}`)) {
    throw new Error('Generated content path must be within the content directory.')
  }

  return fullPath
}

function inferCategory(repo: RepoDetails, content: string, sourceName = repo.name): string {
  const haystack =
    `${sourceName} ${repo.name} ${repo.description ?? ''} ${repo.topics?.join(' ') ?? ''} ${content}`.toLowerCase()
  const match = categoryKeywords.find(({ keywords }) =>
    keywords.some((keyword) => haystack.includes(keyword))
  )

  return match?.category ?? 'Other'
}

function inferTags(repo: RepoDetails, content: string, sourceName = repo.name): string[] {
  const haystack =
    `${sourceName} ${repo.name} ${repo.description ?? ''} ${repo.topics?.join(' ') ?? ''} ${content}`.toLowerCase()
  const topicTags = repo.topics ?? []
  const keywordTags = tagKeywords.filter((keyword) => haystack.includes(keyword))
  const repoNameTags = sourceName
    .split(/[-_]/)
    .map(slugify)
    .filter((tag) => tag && tag !== 'supabase' && tag.length > 2)

  return [...new Set([...topicTags, ...keywordTags, ...repoNameTags])].slice(0, 8)
}

function sanitizeMdxLine(line: string): string {
  return line
    .replace(/<!--(.*?)-->/g, (_, comment: string) => `{/*${comment.replace(/\*\//g, '* /')}*/}`)
    .replace(/<([A-Za-z][A-Za-z0-9_-]*(?:[-_][A-Za-z0-9_-]+|[A-Z0-9_]{2,}))>/g, '\\<$1>')
}

function sanitizeMdxContent(source: string): string {
  let isInCodeFence = false

  return source
    .split('\n')
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        isInCodeFence = !isInCodeFence
        return line
      }

      return isInCodeFence ? line : sanitizeMdxLine(line)
    })
    .join('\n')
}

function toFrontmatter(doc: GeneratedDoc): string {
  const tagLines =
    doc.tags.length === 0
      ? [`tags: []`]
      : ['tags:', ...doc.tags.map((tag) => `  - ${JSON.stringify(tag)}`)]

  return [
    '---',
    `title: ${JSON.stringify(doc.title)}`,
    `description: ${JSON.stringify(doc.description)}`,
    `repo: ${JSON.stringify(doc.repo)}`,
    `repoUrl: ${JSON.stringify(doc.repoUrl)}`,
    `stars: ${doc.stars}`,
    `forks: ${doc.forks}`,
    ...(doc.language ? [`language: ${JSON.stringify(doc.language)}`] : []),
    `isTemplate: ${doc.isTemplate}`,
    ...tagLines,
    `category: ${JSON.stringify(doc.category)}`,
    '---',
  ].join('\n')
}

function buildGeneratedDoc(
  repo: RepoDetails,
  documents: SourceDocument[],
  source: GitHubResourceSource
): GeneratedDoc {
  const combinedContent = documents.map((document) => document.content).join('\n\n')
  const sections = documents.flatMap((document) =>
    extractGettingStartedSections(document.content).map((section) => ({
      label: document.label,
      section,
    }))
  )
  const description =
    repo.description?.trim() ||
    extractFirstParagraph(combinedContent) ||
    `Getting started with ${repo.name}.`
  const body =
    sections.length > 0
      ? sections
          .map(
            ({ label, section }) =>
              `{/* Source: ${label.replace(/\*\//g, '* /')} */}\n\n${sanitizeMdxContent(section)}`
          )
          .join('\n\n')
      : 'No getting-started sections were found in the README, linked docs, or docs directory for this repository.'

  return {
    title: humanizeRepoName(source.name),
    description,
    repo: source.name,
    repoUrl: getGitHubResourceUrl(source.name),
    stars: repo.stargazers_count ?? 0,
    forks: repo.forks_count ?? 0,
    language: repo.language ?? undefined,
    isTemplate: repo.is_template ?? false,
    tags: inferTags(repo, combinedContent, source.name),
    category: inferCategory(repo, combinedContent, source.name),
    content: [
      `> This page is generated from [${source.name}](${getGitHubResourceUrl(source.name)}).`,
      '',
      '## Getting started',
      '',
      body,
    ].join('\n'),
  }
}

async function removeGeneratedContent() {
  await mkdir(contentDirectory, { recursive: true })
  const entries = await readdir(contentDirectory, { withFileTypes: true })

  await Promise.all(
    entries
      .filter((entry) => entry.isDirectory() || extname(entry.name) === '.mdx')
      .map((entry) => rm(resolveContentPath(entry.name), { force: true, recursive: true }))
  )
}

async function main() {
  await ghText(['--version'])
  await removeGeneratedContent()

  const repos = await listRepos()
  const sourcesBySlug = new Map<string, GitHubResourceSource>()

  for (const repo of repos) {
    sourcesBySlug.set(slugify(repo.name), {
      name: repo.name,
      owner: COMMUNITY_ORG,
      repo: repo.name,
    })
  }

  for (const name of communityResourceNames) {
    sourcesBySlug.set(slugify(name), getGitHubResourceSource(name))
  }

  for (const source of sourcesBySlug.values()) {
    const details = await getRepoDetails(source)

    if (!details) continue

    const branch = source.branch ?? details.default_branch
    const tree = await getRepositoryTree(source, branch)
    const documents = await discoverSourceDocuments(source, branch, tree)

    const generated = buildGeneratedDoc(details, documents, source)
    const repoDirectory = resolveContentPath(source.repo)
    const filename = `${slugify(source.name)}.mdx`
    const outputPath = join(repoDirectory, filename)
    const output = `${toFrontmatter(generated)}\n\n${generated.content}\n`

    await mkdir(repoDirectory, { recursive: true })
    await writeFile(outputPath, output)
    console.log(`Generated content/${source.repo}/${filename}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
