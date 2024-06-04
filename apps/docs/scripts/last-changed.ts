/**
 * Updates the `last_changed` table with new content changes.
 *
 * The default behavior is to match checksums to determine the `last_changed`
 * date.
 *
 * Options:
 *
 * --reset, -r
 *  If the `reset` flag is given, the `last_changed` date is determined from
 *  the last Git commit date.
 */

import 'dotenv/config'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import matter from 'gray-matter'
import { createHash } from 'node:crypto'
import { readdirSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { simpleGit } from 'simple-git'

import { Section } from './helpers.mdx'

interface Options {
  reset: boolean
}

interface SectionWithChecksum extends Section {
  checksum: string
}

const REQUIRED_ENV_VARS = {
  SUPABASE_URL: 'NEXT_PUBLIC_SUPABASE_URL',
  SERVICE_ROLE_KEY: 'SUPABASE_SERVICE_ROLE_KEY',
} as const

async function main() {
  console.log('Updating content change times...')

  checkEnv()

  const { reset } = parseOptions()
  const supabase = createSupabaseClient()

  await updateContentDates({ reset, supabase })

  console.log('Content change times successfully updated')
}

function checkEnv() {
  const requiredEnvVars = Object.values(REQUIRED_ENV_VARS)

  for (const variable of requiredEnvVars) {
    if (!process.env[variable]) {
      abortWithError(`Missing required environment variable: ${variable}`)
    }
  }
}

function abortWithError(message: string) {
  console.error(message)
  process.exit(1)
}

function parseOptions(): Options {
  const args = process.argv.slice(2)
  const options = {
    reset: {
      type: 'boolean',
      short: 'r',
    },
  } as const

  const {
    values: { reset },
  } = parseArgs({ args, options })
  return { reset: reset ?? false }
}

function createSupabaseClient() {
  return createClient(
    process.env[REQUIRED_ENV_VARS.SUPABASE_URL],
    process.env[REQUIRED_ENV_VARS.SERVICE_ROLE_KEY]
  )
}

async function updateContentDates({
  supabase,
  reset,
}: {
  supabase: SupabaseClient
  reset: boolean
}) {
  const CONTENT_DIR = getContentDir()
  const mdxFiles = await walkDir(CONTENT_DIR)

  const timestamp = new Date()

  const updateTasks: Array<Promise<void>> = []
  for (const file of mdxFiles) {
    const tasks = await updateTimestamps(file, { supabase, reset, timestamp })
    updateTasks.push(...tasks)
  }
  await Promise.all(updateTasks)

  await cleanupObsoleteRows(timestamp, supabase)
}

function getContentDir() {
  return join(__dirname, '..', 'content')
}

async function walkDir(fullPath: string) {
  const allFiles = readdirSync(fullPath, { withFileTypes: true, recursive: true })
  const mdxFiles = allFiles
    .filter((file) => file.isFile() && file.name.endsWith('.mdx'))
    .map((file) => join(file.parentPath, file.name))
  return mdxFiles
}

async function updateTimestamps(
  filePath: string,
  { supabase, reset, timestamp }: { supabase: SupabaseClient; reset: boolean; timestamp: Date }
) {
  try {
    const content = await readFile(filePath, 'utf-8')
    const sections = processMdx(content)
    return sections.map((section) =>
      reset
        ? updateTimestampsWithLastCommitDate(filePath, section, timestamp, supabase)
        : updateTimestampsWithChecksumMatch(filePath, section, timestamp, supabase).catch(() =>
            updateTimestampsWithLastCommitDate(filePath, section, timestamp, supabase)
          )
    )
  } catch (err) {
    console.error(`Failed to update sections for file ${filePath}`)
  }
}

function processMdx(rawContent: string): Array<SectionWithChecksum> {
  const { content } = matter(rawContent)

  const GLOBAL_HEADING_REGEX = /(?:^|\n)(?=#+\s+[^\n]+[\n$])/g
  const sections = content.split(GLOBAL_HEADING_REGEX)

  const seenHeadings = new Map<string, number>()

  const HEADING_MATCH_REGEX = /^#+\s+([^\n]+)[\n$]/
  const result: Array<SectionWithChecksum> = sections.map((section) => {
    const rawHeading = section.match(HEADING_MATCH_REGEX)?.[1] ?? null

    let heading = rawHeading
    if (rawHeading && seenHeadings.has(rawHeading)) {
      const idx = seenHeadings.get(rawHeading) + 1
      seenHeadings.set(rawHeading, idx)
      heading = `${rawHeading} (${idx})`
    } else if (rawHeading) {
      seenHeadings.set(rawHeading, 1)
    }

    const normalizedSection = section
      .trim()
      .replace(/[\n\t]/g, ' ')
      .replace(/\s+/g, ' ')
    const checksum = createHash('sha256').update(normalizedSection).digest('base64')

    return {
      heading,
      content: normalizedSection,
      checksum,
    }
  })

  return result
}

async function updateTimestampsWithLastCommitDate(
  filePath: string,
  section: SectionWithChecksum,
  timestamp: Date,
  supabase: SupabaseClient
) {
  try {
    const git = simpleGit()
    const updatedAt = (await git.raw('log', '-1', '--format=%cI', filePath)).trim()

    const contentDir = getContentDir()
    const parentPage = `/content${filePath.replace(contentDir, '')}`

    await supabase.from('last_changed').upsert(
      {
        parent_page: parentPage,
        heading: section.heading,
        checksum: section.checksum,
        last_updated: updatedAt,
        last_checked: timestamp,
      },
      { onConflict: 'parent_page,heading' }
    )
  } catch (err) {
    console.error(
      `Failed to update timestamp with last commit date for section ${filePath}${section.heading ? `:${section.heading}` : ''}`
    )
  }
}

async function updateTimestampsWithChecksumMatch(
  filePath: string,
  section: SectionWithChecksum,
  timestamp: Date,
  supabase: SupabaseClient
) {
  const contentDir = getContentDir()
  const parentPage = `/content${filePath.replace(contentDir, '')}`

  try {
    const { data } =
      'heading' in section && section.heading
        ? await supabase
            .from('last_changed')
            .select('id,checksum')
            .eq('parent_page', parentPage)
            .eq('heading', section.heading)
            .maybeSingle()
        : await supabase
            .from('last_changed')
            .select('id,checksum')
            .eq('parent_page', parentPage)
            .is('heading', null)

    if (!data || !('id' in data) || !('checksum' in data)) {
      await updateTimestampsWithLastCommitDate(filePath, section, timestamp, supabase)
    } else {
      const hasChanged = data.checksum !== section.checksum
      if (!hasChanged) return

      await supabase.from('last_changed').update({
        id: data.id,
        checksum: section.checksum,
        last_updated: timestamp,
        last_checked: timestamp,
      })
    }
  } catch (err) {
    console.error(
      `Failed to update the following section via checksum match: ${parentPage}${section.heading ? `:${section.heading}` : ''}`
    )

    // Rethrow error to trigger fallback update via Git commit date
    throw err
  }
}

async function cleanupObsoleteRows(timestamp: Date, supabase: SupabaseClient) {
  try {
    await supabase.from('last_changed').delete().neq('last_checked', timestamp)
  } catch (err) {
    console.error(`Error cleanup obsolete rows: ${err}`)
  }
}

main()
