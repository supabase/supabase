import '../utils/dotenv'

import { mkdir, readdir, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { BASE_PATH } from '~/lib/constants'
import { GENERATED_DIRECTORY, GUIDES_DIRECTORY } from '~/lib/docs'
import remarkMkDocsAdmonition from '~/lib/mdx/plugins/remarkAdmonition'
import { removeTitle } from '~/lib/mdx/plugins/remarkRemoveTitle'
import remarkPyMdownTabs from '~/lib/mdx/plugins/remarkTabs'
import { getGitHubFileContents, octokit, OCTOKIT_RETRY_OPTIONS } from '~/lib/octokit'
import matter from 'gray-matter'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown, gfmToMarkdown } from 'mdast-util-gfm'
import { mdxFromMarkdown, mdxToMarkdown } from 'mdast-util-mdx'
import { toMarkdown } from 'mdast-util-to-markdown'
import { gfm } from 'micromark-extension-gfm'
import { mdxjs } from 'micromark-extension-mdxjs'
import { visit } from 'unist-util-visit'

import type { FederatedContentSource, FederatedPage } from './types'

const SOURCES_DIR = join(dirname(fileURLToPath(import.meta.url)), 'sources')

const PARSE_OPTIONS = {
  extensions: [mdxjs(), gfm()],
  mdastExtensions: [mdxFromMarkdown(), gfmFromMarkdown()],
}
// `fences: true` keeps code blocks as ``` rather than indented, so they
// aren't misread differently (e.g. as MDX/JSX) than they were authored.
const STRINGIFY_OPTIONS = {
  extensions: [mdxToMarkdown(), gfmToMarkdown()],
  bullet: '-' as const,
  listItemIndent: 'one' as const,
  fences: true,
}

/**
 * Discovers every `FederatedContentSource` under `./sources`.
 */
async function loadSources(): Promise<FederatedContentSource[]> {
  const files = (await readdir(SOURCES_DIR)).filter((file) => /\.tsx?$/.test(file))

  return Promise.all(
    files.map(async (file) => {
      const mod = await import(join(SOURCES_DIR, file))
      return mod.default as FederatedContentSource
    })
  )
}

/**
 * Path of a page's remote file, relative to the repo root.
 */
function remotePath(source: FederatedContentSource, page: FederatedPage): string {
  return page.useRoot ? page.remoteFile : `${source.docsDir}/${page.remoteFile}`
}

/**
 * Rewrites a link URL: pages mapped in `source.pageMap` go to their local
 * `/guides/<section>` route, everything else falls back to `externalSite`.
 */
function transformUrl(source: FederatedContentSource, url: string): string {
  try {
    const placeholderHostname = 'placeholder'
    const { hostname, pathname, hash } = new URL(url, `http://${placeholderHostname}`)

    // Don't modify a url with a FQDN or a url that's only a hash
    if (hostname !== placeholderHostname || pathname === '/') {
      return url
    }

    const relativePath = (
      pathname.endsWith('.md')
        ? pathname.replace(/\.md$/, '')
        : isAbsolute(url)
          ? relative(new URL(source.externalSite).pathname, pathname)
          : pathname
    ).replace(/^\//, '')
    const docsRelative = relativePath.replace(new RegExp(`^${source.docsDir}/`), '')

    const mapped = source.pageMap.find(({ remoteFile, useRoot }) =>
      useRoot ? `${relativePath}.md` === remoteFile : `${docsRelative}.md` === remoteFile
    )

    // If we have a mapping for this page, use the mapped path; otherwise
    // link to the original docs
    if (mapped) {
      return `${BASE_PATH}/guides/${source.section}${mapped.slug ? `/${mapped.slug}` : ''}${hash}`
    }
    return source.rawFallback
      ? `${source.externalSite}${pathname}${hash}`
      : `${source.externalSite}/${relativePath}${hash}`
  } catch (err) {
    throw Error('[DOCS] fetch-federated-content: Error transforming markdown URL', { cause: err })
  }
}

async function fetchPage(source: FederatedContentSource, page: FederatedPage): Promise<string> {
  const raw = await getGitHubFileContents({
    org: source.org,
    repo: source.repo,
    path: remotePath(source, page),
    branch: source.branch,
  })

  const tree = fromMarkdown(raw, PARSE_OPTIONS)
  remarkMkDocsAdmonition()(tree)
  remarkPyMdownTabs()(tree)
  if (page.dropLeadingHeading) {
    const [firstNode] = tree.children
    if (firstNode?.type === 'heading' && firstNode.depth === 1) tree.children.splice(0, 1)
  } else {
    removeTitle(page.meta.title)(tree)
  }
  visit(tree, ['link', 'image', 'definition'], (node: any) => {
    node.url = transformUrl(source, node.url)
  })
  const content = toMarkdown(tree, STRINGIFY_OPTIONS).trim()

  const frontmatter: Record<string, string> = {
    title: page.meta.title,
    // Points the "Edit this page on GitHub" link back at the source repo
    // instead of this generated file.
    editLink: `${source.org}/${source.repo}/blob/${source.branch}/${remotePath(source, page)}`,
  }
  if (page.meta.subtitle) frontmatter.subtitle = page.meta.subtitle
  if (page.meta.description) frontmatter.description = page.meta.description
  if (page.meta.tocVideo) frontmatter.tocVideo = page.meta.tocVideo

  return matter.stringify(`${content}\n`, frontmatter)
}

async function fetchRawFile(
  source: FederatedContentSource,
  rawFile: NonNullable<FederatedContentSource['rawFiles']>[number]
): Promise<void> {
  const content = await getGitHubFileContents({
    org: source.org,
    repo: source.repo,
    path: `${source.docsDir}/${rawFile.remoteFile}`,
    branch: source.branch,
  })

  await mkdir(GENERATED_DIRECTORY, { recursive: true })
  await writeFile(join(GENERATED_DIRECTORY, rawFile.outFile), content)
}

async function fetchSource(source: FederatedContentSource): Promise<void> {
  await mkdir(join(GUIDES_DIRECTORY, source.section), { recursive: true })

  await Promise.all([
    ...source.pageMap.map(async (page) => {
      const output = await fetchPage(source, page)

      const outPath = page.slug
        ? join(GUIDES_DIRECTORY, source.section, `${page.slug}.mdx`)
        : join(GUIDES_DIRECTORY, `${source.section}.mdx`)

      await writeFile(outPath, output)
    }),
    ...(source.rawFiles ?? []).map((rawFile) => fetchRawFile(source, rawFile)),
  ])
}

const AI_SKILLS_REPO = {
  org: 'supabase',
  repo: 'agent-skills',
  branch: 'main',
  path: 'skills',
}

/**
 * Lists the skill directories in the agent-skills repo, fetches each
 * `SKILL.md`'s frontmatter, and writes the summary to
 * `features/docs/generated/ai-skills.json` for `AiSkills.utils.ts` to read.
 */
async function fetchAiSkills(): Promise<void> {
  const { data: contents } = await octokit().request('GET /repos/{owner}/{repo}/contents/{path}', {
    owner: AI_SKILLS_REPO.org,
    repo: AI_SKILLS_REPO.repo,
    path: AI_SKILLS_REPO.path,
    ref: AI_SKILLS_REPO.branch,
    request: OCTOKIT_RETRY_OPTIONS,
  })

  if (!Array.isArray(contents)) {
    throw new Error('Expected directory listing from GitHub agent skills repo')
  }

  const skillDirs = contents.filter((item) => item.type === 'dir')

  const skills = await Promise.all(
    skillDirs.map(async (item) => {
      const rawContent = await getGitHubFileContents({
        org: AI_SKILLS_REPO.org,
        repo: AI_SKILLS_REPO.repo,
        branch: AI_SKILLS_REPO.branch,
        path: `${AI_SKILLS_REPO.path}/${item.name}/SKILL.md`,
      })
      const { data } = matter(rawContent) as { data: { description?: string } }

      return {
        name: item.name,
        description: data.description || '',
        installCommand: `npx skills add supabase/agent-skills --skill ${item.name}`,
      }
    })
  )

  skills.sort((a, b) => a.name.localeCompare(b.name))

  await mkdir(GENERATED_DIRECTORY, { recursive: true })
  await writeFile(join(GENERATED_DIRECTORY, 'ai-skills.json'), JSON.stringify(skills, null, 2))
}

async function fetchFederatedContent() {
  const sources = await loadSources()

  await Promise.all([...sources.map(fetchSource), fetchAiSkills()])

  const pageCount = sources.reduce((sum, source) => sum + source.pageMap.length, 0)
  console.log(
    `Fetched ${pageCount} federated page(s) across ${sources.length} source(s) into content/guides/`
  )
}

fetchFederatedContent().catch((error) => {
  throw error
})
