/* eslint-disable turbo/no-undeclared-env-vars */

/**
 * Sync new troubleshooting entries from the GitHub repo with GitHub
 * Discussions.
 */

import { createAppAuth } from '@octokit/auth-app'
import { Octokit } from '@octokit/core'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'
import matter from 'gray-matter'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown, gfmToMarkdown } from 'mdast-util-gfm'
import { mdxFromMarkdown, mdxToMarkdown } from 'mdast-util-mdx'
import { toMarkdown } from 'mdast-util-to-markdown'
import { gfm } from 'micromark-extension-gfm'
import { mdxjs } from 'micromark-extension-mdxjs'
import { readFile, writeFile } from 'node:fs/promises'
import { stringify } from 'smol-toml'
import toml from 'toml'

import {
  getAllTroubleshootingEntriesInternal as getAllTroubleshootingEntries,
  getArticleSlug,
} from './Troubleshooting.utils.common.mjs'

import 'dotenv/config'

const REPOSITORY_ID = 'MDEwOlJlcG9zaXRvcnkyMTQ1ODcxOTM='
const TROUBLESHOOTING_CATEGORY_ID = 'DIC_kwDODMpXOc4CUvEr'
const REPOSITORY_OWNER = 'supabase'
const REPOSITORY_NAME = 'supabase'

/**
 * @typedef {import('./Troubleshooting.utils.common.mjs').TroubleshootingEntry} TroubleshootingEntry
 * @typedef {import('./Troubleshooting.utils.common.mjs').TroubleshootingMetadata} TroubleshootingMetadata
 */

/**
 * @type {import('@octokit/core').Octokit}
 */
let octokitInstance
/**
 * @type {SupabaseClient<import('../../../../packages/common').Database>}
 */
let supabaseAdminClient

function octokit() {
  if (!octokitInstance) {
    octokitInstance = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: process.env.SEARCH_GITHUB_APP_ID,
        installationId: process.env.SEARCH_GITHUB_APP_INSTALLATION_ID,
        privateKey: process.env.SEARCH_GITHUB_APP_PRIVATE_KEY,
      },
    })
  }

  return octokitInstance
}

export function supabaseAdmin() {
  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SECRET_KEY
    )
  }

  return supabaseAdminClient
}

async function syncTroubleshootingEntries() {
  console.log('[START] Syncing troubleshooting entries to GitHub')

  const [troubleshootingEntries, discussions] = await Promise.all([
    getAllTroubleshootingEntries(),
    getAllTroubleshootingDiscussions(),
  ])

  console.log(`[INFO] Found ${troubleshootingEntries.length} existing entries`)

  const tasks = troubleshootingEntries.map(async (entry) => {
    const databaseId = entry.data.database_id
    if (databaseId.startsWith('pseudo-')) {
      // The database entry is faked, so we may need to create a new one.
      // There's also an edge case we need to check for: the entry has already
      // been created, but the new database ID hasn't been written to the file
      // yet.
      if (await entryExists(entry)) return

      const discussion = entry.data.github_url
        ? await getGithubIdForDiscussion(discussions, entry)
        : await createGithubDiscussion(entry)

      let id
      try {
        id = await insertNewTroubleshootingEntry(entry, discussion)
      } catch (error) {
        console.error(`[ERROR] Failed to insert new entry for ${entry.data.title}: %O`, error)
        console.log(
          `[INFO] Rolling back discussion creation for ${entry.data.title} (GitHub ID ${discussion.id})`
        )
        await rollbackGithubDiscussion(discussion.id)
        throw error
      }

      await updateFileId(entry, id)
    } else {
      // The database entry already exists, so check for updates.
      const contentHasChanged = await updateChecksumIfNeeded(entry)
      if (contentHasChanged) {
        await updateGithubDiscussion(entry)
      }
    }
  })

  const results = await Promise.allSettled(tasks)
  let hasErrors = false
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(
        `[ERROR] Failed to insert and/or update for ${troubleshootingEntries[index].filePath}:\n%O`,
        result.reason
      )
      hasErrors = true
    }
  })

  return hasErrors
}

/**
 * @param {TroubleshootingEntry} entry
 * @throws If the database check fails for some unknown reason
 */
async function entryExists(entry) {
  const checksum = calculateChecksum(entry.content)
  const { error } = await supabaseAdmin()
    .from('troubleshooting_entries')
    .select('id')
    .eq('checksum', checksum)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No entry found
      return false
    }
    throw error
  }

  console.log(
    `[INFO] Entry for ${entry.data.title} already exists. Not creating a new one to prevent duplicates.`
  )
  return true
}

/**
 * @param {string} content
 */
function calculateChecksum(content) {
  // Normalize to ignore changes that don't affect the final displayed content.
  const mdast = fromMarkdown(content, {
    extensions: [gfm(), mdxjs()],
    mdastExtensions: [gfmFromMarkdown(), mdxFromMarkdown()],
  })
  const normalized = toMarkdown(mdast, { extensions: [gfmToMarkdown(), mdxToMarkdown()] })

  return createHash('sha256').update(normalized).digest('base64')
}

/**
 * @param {TroubleshootingEntry} entry
 *
 * @param {Object} discussion
 * @param {string} discussion.id
 * @param {string} discussion.url
 *
 * @throws If the database insertion fails
 */
async function insertNewTroubleshootingEntry(entry, discussion) {
  console.log(`[INFO] Inserting entry for ${entry.data.title} into DB`)

  const now = new Date().toISOString()
  const checksum = calculateChecksum(entry.content)

  const { data, error } = await supabaseAdmin()
    .from('troubleshooting_entries')
    .insert({
      api: entry.data.api,
      checksum,
      date_created: entry.data.date_created?.toISOString() ?? now,
      date_updated: now,
      errors: entry.data.errors,
      github_id: discussion.id,
      github_url: discussion.url,
      keywords: entry.data.keywords,
      title: entry.data.title,
      topics: entry.data.topics,
    })
    .select('id')
    .single()
  if (error) {
    throw error
  }

  return data.id
}

/**
 * @param {TroubleshootingEntry} entry
 *
 * @throws If the database update fails
 */
async function updateChecksumIfNeeded(entry) {
  const { data, error } = await supabaseAdmin()
    .from('troubleshooting_entries')
    .select('checksum')
    .eq('id', entry.data.database_id)
    .single()
  if (error) {
    throw error
  }

  const newChecksum = calculateChecksum(entry.content)
  if (data.checksum !== newChecksum) {
    console.log(`[INFO] Content changed for ${entry.data.title}. Updating checksum.`)

    const now = new Date().toISOString()
    const { error } = await supabaseAdmin()
      .from('troubleshooting_entries')
      .update({
        checksum: newChecksum,
        date_updated: now,
      })
      .eq('id', entry.data.database_id)

    if (error) {
      throw error
    }

    return true
  }

  return false
}

/**
 * @param {TroubleshootingEntry} entry
 */
function addCanonicalUrl(entry) {
  const docsUrl = 'https://supabase.com/docs/guides/troubleshooting/' + getArticleSlug(entry.data)
  const content =
    `_This is a copy of a troubleshooting article on Supabase's docs site. It may be missing some details from the original. View the [original article](${docsUrl})._\n\n` +
    entry.contentWithoutJsx
  return content
}

/**
 * @param {TroubleshootingEntry} entry
 */
async function createGithubDiscussion(entry) {
  console.log(`[INFO] Creating GitHub discussion for ${entry.data.title}`)
  const content = addCanonicalUrl(entry)

  const mutation = `
    mutation {
      createDiscussion(input: {
        repositoryId: "${REPOSITORY_ID}",
        categoryId: "${TROUBLESHOOTING_CATEGORY_ID}",
        body: "${content}",
        title: "${entry.data.title}"
      }) {
        discussion {
          id
          url
        }
      }
    }
    `

  const {
    createDiscussion: { discussion },
  } = await octokit().graphql(mutation)
  console.log(`[INFO] Created GitHub discussion for ${entry.data.title}: %s`, discussion.url)
  return discussion
}

/**
 * @returns {Promise<{id: string, url: string}[]>}
 */
async function getAllTroubleshootingDiscussions() {
  const query = `
    query getDiscussions($cursor: String) {
      repository(owner: "${REPOSITORY_OWNER}", name: "${REPOSITORY_NAME}") {
        discussions(first: 100, after: $cursor, categoryId: "${TROUBLESHOOTING_CATEGORY_ID}") {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            url
          }
        }
      }
    }
  `

  const discussions = []
  let hasNextPage = true
  let cursor

  while (hasNextPage) {
    const {
      repository: {
        discussions: { nodes: moreDiscussions, pageInfo },
      },
    } = await octokit().graphql(query, { cursor })

    discussions.push(...moreDiscussions)
    hasNextPage = pageInfo.hasNextPage
    cursor = pageInfo.endCursor
  }

  return discussions
}

/**
 * @param {{id: string, url: string}[]} discussions
 * @param {TroubleshootingEntry} entry
 *
 * @throws If matching discussion not found
 */
async function getGithubIdForDiscussion(discussions, entry) {
  const matchingDiscussion = discussions.find(
    (discussion) => discussion.url === entry.data.github_url
  )
  if (!matchingDiscussion) {
    throw new Error(`No matching discussion found for URL: ${entry.data.github_url}`)
  }
  return matchingDiscussion
}

/**
 * @param {TroubleshootingEntry} entry
 *
 * @throws If stored discussion ID for entry not found
 */
async function updateGithubDiscussion(entry) {
  console.log(`[INFO] Updating discussion content for ${entry.data.title}`)

  const { data, error } = await supabaseAdmin()
    .from('troubleshooting_entries')
    .select('github_id')
    .eq('id', entry.data.database_id)
    .single()
  if (error) {
    throw error
  }

  const content = addCanonicalUrl(entry)
  const mutation = `
    mutation {
      updateDiscussion(input: {
        discussionId: "${data.github_id}",
        body: "${content}",
      }) {
        discussion {
          id
        }
      }
    }
    `

  await octokit().graphql(mutation)
  console.log(`[INFO] Updated discussion content for ${entry.data.title}`)
}

/** @param {string} id */
async function rollbackGithubDiscussion(id) {
  try {
    const mutation = `
    mutation {
      deleteDiscussion(input: {
        id: "${id}",
      }) {
        discussion {
          id
        }
      }
    }
    `

    await octokit().graphql(mutation)
    console.log(`[INFO] Rolled back discussion creation for ${id}`)
  } catch (error) {
    console.error(`[ERROR] Failed to rollback discussion creation for ${id}: %O`, error)
  }
}

/**
 * @param {TroubleshootingEntry} entry
 * @param {string} id
 *
 * @throws Passes through readFile and writeFile errors without catching
 */
async function updateFileId(entry, id) {
  console.log(`[INFO] Writing database ID to file for ${entry.filePath}`)

  const fileContents = await readFile(entry.filePath, 'utf-8')
  const { data, content } = matter(fileContents, {
    language: 'toml',
    engines: { toml: toml.parse.bind(toml) },
  })
  data.database_id = id

  const newFrontmatter = stringify(data)
  const newContent = `---\n${newFrontmatter}\n---\n${content}`

  await writeFile(entry.filePath, newContent)
}

async function main() {
  try {
    const hasErrors = await syncTroubleshootingEntries()
    if (hasErrors) {
      process.exit(1)
    }
  } catch (error) {
    console.error(`[ERROR] %O`, error)
    process.exit(1)
  }
}

main()
