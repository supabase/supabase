import '../utils/dotenv'

import { mkdir, readdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { GUIDES_DIRECTORY } from '~/lib/docs'
import { getGitHubFileContents } from '~/lib/octokit'
import matter from 'gray-matter'

import type { FederatedContentSource, FederatedPage } from './types'

const SOURCES_DIR = join(dirname(fileURLToPath(import.meta.url)), 'sources')

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

async function fetchPage(source: FederatedContentSource, page: FederatedPage): Promise<string> {
  const content = await getGitHubFileContents({
    org: source.org,
    repo: source.repo,
    path: `${source.docsDir}/${page.remoteFile}`,
    branch: source.branch,
  })

  const frontmatter: Record<string, string> = {
    title: page.meta.title,
    // Points the "Edit this page on GitHub" link back at the source repo
    // instead of this generated file.
    editLink: `${source.org}/${source.repo}/blob/${source.branch}/${source.docsDir}/${page.remoteFile}`,
  }
  if (page.meta.subtitle) frontmatter.subtitle = page.meta.subtitle

  return matter.stringify(`${content.trim()}\n`, frontmatter)
}

async function fetchSource(source: FederatedContentSource): Promise<void> {
  await mkdir(join(GUIDES_DIRECTORY, source.section), { recursive: true })

  await Promise.all(
    source.pageMap.map(async (page) => {
      const output = await fetchPage(source, page)

      const outPath = page.slug
        ? join(GUIDES_DIRECTORY, source.section, `${page.slug}.mdx`)
        : join(GUIDES_DIRECTORY, `${source.section}.mdx`)

      await writeFile(outPath, output)
    })
  )
}

async function fetchFederatedContent() {
  const sources = await loadSources()

  await Promise.all(sources.map(fetchSource))

  const pageCount = sources.reduce((sum, source) => sum + source.pageMap.length, 0)
  console.log(
    `Fetched ${pageCount} federated page(s) across ${sources.length} source(s) into content/guides/`
  )
}

fetchFederatedContent().catch((error) => {
  console.error(error)
  process.exit(1)
})
