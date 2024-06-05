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

interface Stats {
  sectionsUpdated: number
  sectionsRemoved: number
}

type SectionWithChecksum = Omit<Section, 'heading'> &
  Pick<Required<Section>, 'heading'> & {
    checksum: string
  }

const REQUIRED_ENV_VARS = {
  SUPABASE_URL: 'NEXT_PUBLIC_SUPABASE_URL',
  SERVICE_ROLE_KEY: 'SUPABASE_SERVICE_ROLE_KEY',
} as const

async function main() {
  console.log('Updating content timestamps....')

  checkEnv()

  const { reset } = parseOptions()
  const supabase = createSupabaseClient()

  const stats: Stats = {
    sectionsUpdated: 0,
    sectionsRemoved: 0,
  }

  await updateContentDates({ reset, supabase, stats })

  console.log('Content timestamps successfully updated')
  console.log(`  - ${stats.sectionsUpdated} sections updated`)
  console.log(`  - ${stats.sectionsRemoved} old sections removed`)
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
  stats,
}: {
  supabase: SupabaseClient
  reset: boolean
  stats: Stats
}) {
  const CONTENT_DIR = getContentDir()
  const mdxFiles = await walkDir(CONTENT_DIR)

  const timestamp = new Date()

  const updateTasks: Array<Promise<void>> = []
  for (const file of mdxFiles) {
    const tasks = await updateTimestamps(file, { supabase, reset, timestamp, stats })
    updateTasks.push(...tasks)
  }
  await Promise.all(updateTasks)

  await cleanupObsoleteRows(timestamp, supabase, stats)
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
  {
    supabase,
    reset,
    timestamp,
    stats,
  }: { supabase: SupabaseClient; reset: boolean; timestamp: Date; stats: Stats }
) {
  try {
    const content = await readFile(filePath, 'utf-8')
    const sections = processMdx(content)
    return sections.map((section) => {
      if (reset) {
        return updateTimestampsWithLastCommitDate(filePath, section, timestamp, supabase, stats)
      } else {
        throw Error('not implemented')
      }
    })
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
    const rawHeading = section.match(HEADING_MATCH_REGEX)?.[1] ?? '[EMPTY]'

    let heading = rawHeading
    if (seenHeadings.has(rawHeading)) {
      const idx = seenHeadings.get(rawHeading) + 1
      seenHeadings.set(rawHeading, idx)
      heading = `${rawHeading} (${idx})`
    } else {
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
  supabase: SupabaseClient,
  stats: Stats
) {
  try {
    const git = simpleGit()
    const updatedAt = (await git.raw('log', '-1', '--format=%cI', filePath)).trim()

    const contentDir = getContentDir()
    const parentPage = `/content${filePath.replace(contentDir, '')}`

    const { data, error } = await supabase
      .from('last_changed')
      .select('id')
      .eq('parent_page', parentPage)
      .eq('heading', section.heading)
      .maybeSingle()
    if (error) {
      throw Error(error.message ?? 'Failed to fetch section from database')
    }

    if (data && 'id' in data) {
      const { error } = await supabase
        .from('last_changed')
        .update({
          checksum: section.checksum,
          last_updated: updatedAt,
          last_checked: timestamp,
        })
        .eq('id', data.id)
      if (error) {
        throw Error(error.message ?? 'Failed to update row')
      }
      stats.sectionsUpdated++
    } else {
      const { error } = await supabase.from('last_changed').insert({
        parent_page: parentPage,
        heading: section.heading,
        checksum: section.checksum,
        last_updated: updatedAt,
        last_checked: timestamp,
      })
      if (error) {
        throw Error(error.message ?? 'Failed to insert row')
      }
      stats.sectionsUpdated++
    }
  } catch (err) {
    console.error(
      `Failed to update timestamp with last commit date for section ${filePath}:${section.heading}: ${err}`
    )
  }
}

async function cleanupObsoleteRows(timestamp: Date, supabase: SupabaseClient, stats: Stats) {
  try {
    const { count, error } = await supabase
      .from('last_changed')
      .delete({ count: 'exact' })
      .neq('last_checked', timestamp.toISOString())
    stats.sectionsRemoved = count
    if (error) {
      throw Error(error.message ?? 'Failed to delete rows')
    }
  } catch (err) {
    console.error(`Error cleanup obsolete rows: ${err}`)
  }
}

main()
