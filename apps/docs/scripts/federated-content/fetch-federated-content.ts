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
import emoji from 'remark-emoji'
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
// remark-emoji's attacher is typed with a unified `this: Processor` context
// it never actually uses; cast it to the plain transformer factory it is.
const emojiTransform = (emoji as unknown as () => (tree: any) => void)()

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

type LatestTagQueryResponse = {
  repository: {
    refs: {
      nodes: { name: string }[] | null
      pageInfo: { hasNextPage: boolean; endCursor: string | null }
    }
  }
}

const LATEST_TAG_QUERY = `
  query LatestTagQuery($owner: String!, $name: String!, $after: String) {
    repository(owner: $owner, name: $name) {
      refs(
        refPrefix: "refs/tags/",
        orderBy: { field: TAG_COMMIT_DATE, direction: DESC },
        first: 20,
        after: $after
      ) {
        nodes { name }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
`

/**
 * Resolves a source's `latestTag.pattern` to the newest matching tag name.
 * GraphQL is required here since the REST API can't order tags by date.
 */
async function resolveLatestTag(
  source: FederatedContentSource,
  after: string | null = null
): Promise<string> {
  const pattern = new RegExp(source.latestTag!.pattern)

  const {
    repository: {
      refs: {
        nodes,
        pageInfo: { hasNextPage, endCursor },
      },
    },
  } = await octokit().graphql<LatestTagQueryResponse>(LATEST_TAG_QUERY, {
    owner: source.org,
    name: source.repo,
    after,
  })

  const tag = nodes?.find(({ name }) => pattern.test(name))?.name
  if (tag) return tag
  if (hasNextPage && endCursor) return resolveLatestTag(source, endCursor)

  throw new Error(
    `No tag matching ${source.latestTag!.pattern} found for ${source.org}/${source.repo}`
  )
}

/**
 * Rewrites a link URL: pages mapped in `source.pageMap` go to their local
 * `/guides/<section>` route, everything else falls back to `externalSite`.
 */
function transformUrl(source: FederatedContentSource, url: string): string {
  const assetPattern = /(\.\.\/)+assets\//
  if (source.assetsDir && assetPattern.test(url)) {
    return url.replace(
      assetPattern,
      `https://raw.githubusercontent.com/${source.org}/${source.repo}/${source.branch}/${source.assetsDir}/`
    )
  }

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

  // Strip the source file's own frontmatter, if any; we build our own from
  // `page.meta` below rather than merging it in.
  const tree = fromMarkdown(matter(raw).content, PARSE_OPTIONS)
  remarkMkDocsAdmonition()(tree)
  remarkPyMdownTabs()(tree)
  emojiTransform(tree)
  if (page.dropLeadingHeading) {
    const [firstNode] = tree.children
    if (firstNode?.type === 'heading' && firstNode.depth === 1) tree.children.splice(0, 1)
  } else {
    removeTitle(page.meta.title)(tree)
  }
  visit(tree, ['link', 'image', 'definition'], (node: any) => {
    node.url = transformUrl(source, node.url)
  })
  let content = toMarkdown(tree, STRINGIFY_OPTIONS).trim()
  if (page.meta.dashboardIntegrationPath) {
    content = `<WrapperDashboardIntegration title="${page.meta.title}" path="${page.meta.dashboardIntegrationPath}" />\n\n${content}`
  }

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

async function fetchSource(baseSource: FederatedContentSource): Promise<void> {
  const source = baseSource.latestTag
    ? { ...baseSource, branch: await resolveLatestTag(baseSource) }
    : baseSource

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

const SPLINTER_REPO = {
  org: 'supabase',
  repo: 'splinter',
  branch: 'main',
  docsDir: 'docs',
}

/**
 * Rewrites a splinter lint doc's link: cross-references to other lints
 * become `?lint=<path>` (matching `Tabs`'s `queryGroup` tab-switching), and
 * everything else falls back to viewing the file on GitHub.
 */
function splinterUrlTransform(lintPaths: string[]) {
  return (url: string): string => {
    try {
      const placeholderHostname = 'placeholder'
      const { hostname, pathname, hash } = new URL(url, `http://${placeholderHostname}`)

      if (hostname !== placeholderHostname || pathname === '/') {
        return url
      }

      const basename = pathname.split('/').at(-1)!.replace(/\.md$/, '')

      if (lintPaths.includes(basename)) {
        return `?lint=${basename}${hash}`
      }

      return `https://github.com/${SPLINTER_REPO.org}/${SPLINTER_REPO.repo}/blob/${SPLINTER_REPO.branch}${pathname}${hash}`
    } catch (err) {
      console.error('Error transforming markdown URL', err)
      return url
    }
  }
}

/**
 * Lists the numbered lint docs in the splinter repo, transforms each the
 * same way as a guide page, and writes them to
 * `features/docs/generated/database-advisors.json` for the
 * `DatabaseAdvisorsIndex` component to read.
 */
async function fetchDatabaseAdvisors(): Promise<void> {
  const { data: contents } = await octokit().request('GET /repos/{owner}/{repo}/contents/{path}', {
    owner: SPLINTER_REPO.org,
    repo: SPLINTER_REPO.repo,
    path: SPLINTER_REPO.docsDir,
    ref: SPLINTER_REPO.branch,
    request: OCTOKIT_RETRY_OPTIONS,
  })

  if (!Array.isArray(contents)) {
    throw new Error('Expected directory listing from GitHub splinter repo')
  }

  const lintFiles = contents.filter(({ path }) => /docs\/\d+.+\.md$/.test(path))
  const lintPaths = lintFiles.map(({ path }) => path.split('/').at(-1)!.replace(/\.md$/, ''))
  const urlTransform = splinterUrlTransform(lintPaths)

  const lints = await Promise.all(
    lintFiles.map(async ({ path }) => {
      const raw = await getGitHubFileContents({
        org: SPLINTER_REPO.org,
        repo: SPLINTER_REPO.repo,
        path,
        branch: SPLINTER_REPO.branch,
      })

      const tree = fromMarkdown(matter(raw).content, PARSE_OPTIONS)
      remarkMkDocsAdmonition()(tree)
      remarkPyMdownTabs()(tree)
      visit(tree, ['link', 'image', 'definition'], (node: any) => {
        node.url = urlTransform(node.url)
      })

      return {
        path: path.split('/').at(-1)!.replace(/\.md$/, ''),
        content: toMarkdown(tree, STRINGIFY_OPTIONS).trim(),
      }
    })
  )

  await mkdir(GENERATED_DIRECTORY, { recursive: true })
  await writeFile(
    join(GENERATED_DIRECTORY, 'database-advisors.json'),
    JSON.stringify(lints, null, 2)
  )
}

async function fetchFederatedContent() {
  const sources = await loadSources()

  await Promise.all([...sources.map(fetchSource), fetchAiSkills(), fetchDatabaseAdvisors()])

  const pageCount = sources.reduce((sum, source) => sum + source.pageMap.length, 0)
  console.log(
    `Fetched ${pageCount} federated page(s) across ${sources.length} source(s) into content/guides/`
  )
}

fetchFederatedContent().catch((error) => {
  throw error
})
