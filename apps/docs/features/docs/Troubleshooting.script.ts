/**
 * Sync new troubleshooting entries from the GitHub repo with GitHub
 * Discussions.
 */

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

import { octokit } from '~/lib/octokit'
import { supabaseAdmin } from '~/lib/supabaseAdmin'
import {
  getAllTroubleshootingEntries,
  getArticleSlug,
  type ITroubleshootingEntry,
} from './Troubleshooting.utils'

async function syncTroubleshootingEntries() {
  const troubleshootingEntries = await getAllTroubleshootingEntries()

  const tasks = troubleshootingEntries.map(async (entry) => {
    const databaseId = entry.data.database_id
    if (databaseId.startsWith('pseudo-')) {
      // The database entry is faked, so we need to insert a new entry.
      const githubUrl = entry.data.github_url ?? (await createGithubDiscussion(entry))
      const id = await insertNewTroubleshootingEntry(entry, githubUrl)
      await updateFileId(entry, id)
    } else {
      // The database entry already exists, so check for updates.
      await updateChecksumIfNeeded(entry)
    }
  })

  const results = await Promise.allSettled(tasks)
  let hasErrors = false
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`Failed to insert GitHub discussion for ${index}:`, result.reason)
      hasErrors = true
    }
  })

  return hasErrors
}

function calculateChecksum(content: string) {
  // Normalize to ignore changes that don't affect the final displayed content.
  const mdast = fromMarkdown(content, {
    extensions: [gfm(), mdxjs()],
    mdastExtensions: [gfmFromMarkdown(), mdxFromMarkdown()],
  })
  const normalized = toMarkdown(mdast, { extensions: [gfmToMarkdown(), mdxToMarkdown()] })

  return createHash('sha256').update(normalized).digest('base64')
}

async function insertNewTroubleshootingEntry(entry: ITroubleshootingEntry, githubUrl: string) {
  const timestamp = Date.now()
  const checksum = calculateChecksum(entry.content)

  const { data, error } = await supabaseAdmin()
    .from('troubleshooting_entries')
    .insert({
      ...entry.data,
      // @ts-ignore
      checksum,
      github_url: githubUrl,
      date_created: timestamp,
      date_updated: timestamp,
    })
    .select('id')
    .single()
  if (error) {
    throw error
  }

  return data.id
}

async function updateChecksumIfNeeded(entry: ITroubleshootingEntry) {
  const { data, error } = await supabaseAdmin()
    .from('troubleshooting_entries')
    .select('checksum')
    .eq('id', entry.data.database_id)
    .single()
  if (error) {
    throw error
  }

  if (data.checksum !== calculateChecksum(entry.content)) {
    const timestamp = new Date().toISOString()
    const { error } = await supabaseAdmin()
      .from('troubleshooting_entries')
      .update({
        checksum: calculateChecksum(entry.content),
        date_updated: timestamp,
      })
      .eq('id', entry.data.database_id)

    if (error) {
      throw error
    }
  }
}

async function createGithubDiscussion(entry: ITroubleshootingEntry) {
  const docsUrl = 'https://supabase.com/docs/guides/troubleshooting/' + getArticleSlug(entry.data)
  const content =
    entry.content +
    `\n\n_This is a copy of a troubleshooting article on Supabase's docs site. You can find the original [here](${docsUrl})._`

  const mutation = `
    mutation {
      createDiscussion(input: {
        repositoryId: "MDEwOlJlcG9zaXRvcnkyMTQ1ODcxOTM=",
        categoryId: "DIC_kwDODMpXOc4CUvEr",
        body: "${content}",
        title: "${entry.data.title}"
      }) {
        discussion {
          url
        }
      }
    }
    `

  const { discussion } = await octokit().graphql<{ discussion: { url: string } }>(mutation)
  return discussion.url
}

async function updateFileId(entry: ITroubleshootingEntry, id: string) {
  const fileContents = await readFile(entry.filePath, 'utf-8')
  const { data, content } = matter(fileContents, {
    language: 'toml',
    engine: toml.parse.bind(toml),
  })
  data.database_id = id

  const newFrontmatter = stringify(data)
  const newContent = `---\n${newFrontmatter}\n---\n\n${content}`

  await writeFile(entry.filePath, newContent)
}

async function main() {
  try {
    const hasErrors = await syncTroubleshootingEntries()
    if (hasErrors) {
      process.exit(1)
    }
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

main()
