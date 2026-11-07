import '../utils/dotenv'

import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { ContentListingItem } from '~/lib/content-listings.schema'
import { FEDERATED_CONTENT_LISTING_DIRECTORY } from '~/lib/federated-content-listing.utils'
import { getGitHubFileContents, octokit, OCTOKIT_RETRY_OPTIONS } from '~/lib/octokit'
import matter from 'gray-matter'
import type { Heading, Paragraph } from 'mdast'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { toString } from 'mdast-util-to-string'

import { python } from './sources/python'
import type { FederatedContentListingSource } from './types'

const SOURCES: Record<string, FederatedContentListingSource> = { python }

/**
 * Builds a listing item from a remote markdown file. `title` and
 * `description` come from its frontmatter, falling back to its first h1 and
 * first paragraph.
 */
function toListingItem(
  source: FederatedContentListingSource,
  name: string,
  raw: string
): ContentListingItem {
  const { data, content } = matter(raw)
  const tree = fromMarkdown(content)
  const heading = tree.children.find(
    (node): node is Heading => node.type === 'heading' && node.depth === 1
  )
  const paragraph = tree.children.find((node): node is Paragraph => node.type === 'paragraph')
  const slug = name.replace(/\.mdx?$/, '')

  return {
    title: data.title ?? (heading ? toString(heading) : slug),
    description: data.description ?? (paragraph && toString(paragraph).replace(/\s+/g, ' ')),
    href: `${source.externalSite}/${slug}`,
  }
}

async function fetchListing(source: FederatedContentListingSource): Promise<ContentListingItem[]> {
  const { data: contents } = await octokit().request('GET /repos/{owner}/{repo}/contents/{path}', {
    owner: source.org,
    repo: source.repo,
    path: source.docsDir,
    ref: source.branch,
    request: OCTOKIT_RETRY_OPTIONS,
  })

  if (!Array.isArray(contents)) {
    throw new Error(
      `Expected directory listing from ${source.org}/${source.repo}/${source.docsDir}`
    )
  }

  const files = contents.filter(
    ({ type, name }) => type === 'file' && /\.mdx?$/.test(name) && !source.ignore?.includes(name)
  )

  return Promise.all(
    files.map(async ({ name, path }) => {
      const raw = await getGitHubFileContents({
        org: source.org,
        repo: source.repo,
        path,
        branch: source.branch,
      })
      return toListingItem(source, name, raw)
    })
  )
}

/**
 * Lists each source's docs directory and writes its pages, as a
 * `ContentListingItem[]`, to `features/docs/generated/federated-content-listing/<id>.json`
 * for `<FederatedContentListing id="<id>" />` to read.
 */
async function fetchFederatedContentListing() {
  await mkdir(FEDERATED_CONTENT_LISTING_DIRECTORY, { recursive: true })

  await Promise.all(
    Object.entries(SOURCES).map(async ([id, source]) => {
      const items = await fetchListing(source)
      await writeFile(
        join(FEDERATED_CONTENT_LISTING_DIRECTORY, `${id}.json`),
        JSON.stringify(items, null, 2)
      )
    })
  )

  console.log(`Fetched ${Object.keys(SOURCES).length} federated content listing(s)`)
}

fetchFederatedContentListing().catch((error) => {
  throw error
})
