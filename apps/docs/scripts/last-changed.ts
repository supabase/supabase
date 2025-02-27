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
import { SimpleGit, simpleGit } from 'simple-git'
import toml from 'toml'

import { Section } from './helpers.mdx'

interface Options {
  reset: boolean
}

interface Stats {
  sectionsUpdated: number
  sectionsErrored: number
}

interface Ctx {
  supabase: SupabaseClient
  git: SimpleGit
  stats: Stats
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
  const git = simpleGit()

  const stats: Stats = {
    sectionsUpdated: 0,
    sectionsErrored: 0,
  }

  const ctx: Ctx = { supabase, git, stats }

  await updateContentDates({ reset, ctx })

  console.log('Content timestamps successfully updated')
  console.log(`  - ${stats.sectionsUpdated} sections updated`)
  console.log(`  - ${stats.sectionsErrored} sections errored when updating`)

  if (stats.sectionsErrored) process.exit(1)
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

async function updateContentDates({ reset, ctx }: { reset: boolean; ctx: Ctx }) {
  const CONTENT_DIR = getContentDir()
  const mdxFiles = await walkDir(CONTENT_DIR)

  const timestamp = new Date()

  const updateTasks: Array<Promise<void>> = []
  for (const file of mdxFiles) {
    const tasks = await updateTimestamps(file, { reset, timestamp, ctx })
    updateTasks.push(...tasks)
  }
  await Promise.all(updateTasks)
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
  { reset, timestamp, ctx }: { reset: boolean; timestamp: Date; ctx: Ctx }
) {
  try {
    const content = await readFile(filePath, 'utf-8')
    const sections = processMdx(content)
    return sections.map((section) => {
      if (reset) {
        return updateTimestampsWithLastCommitDate(filePath, section, timestamp, ctx)
      } else {
        return updateTimestampsWithChecksumMatch(filePath, section, timestamp, ctx)
      }
    })
  } catch (err) {
    console.error(`Failed to update sections for file ${filePath}`)
  }
}

function processMdx(rawContent: string): Array<SectionWithChecksum> {
  let content: string
  try {
    content = matter(rawContent).content
  } catch (err) {
    content = matter(rawContent, {
      language: 'toml',
      engines: { toml: toml.parse.bind(toml) },
    }).content
  }

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
      heading = `${rawHeading} (__UNIQUE_MARKER__${idx})`
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
  ctx: Ctx
) {
  const parentPage = getContentDirParentPage(filePath)

  try {
    const updatedAt = await getGitUpdatedAt(filePath, ctx)

    const { error } = await ctx.supabase
      .from('last_changed')
      .upsert(
        {
          parent_page: parentPage,
          heading: section.heading,
          checksum: section.checksum,
          last_updated: updatedAt,
          last_checked: timestamp,
        },
        {
          onConflict: 'parent_page,heading',
        }
      )
      .lt('last_checked', timestamp)
    if (error) {
      throw Error(error.message ?? 'Failed to upsert')
    }
    ctx.stats.sectionsUpdated++
  } catch (err) {
    console.error(
      `Failed to update timestamp with last commit date for section ${parentPage}:${section.heading}:\n${err}`
    )
    ctx.stats.sectionsErrored++
  }
}

async function updateTimestampsWithChecksumMatch(
  filePath: string,
  section: SectionWithChecksum,
  timestamp: Date,
  ctx: Ctx
) {
  const parentPage = getContentDirParentPage(filePath)

  try {
    const gitUpdatedAt = await getGitUpdatedAt(filePath, ctx)

    const { data, error } = await ctx.supabase.rpc('update_last_changed_checksum', {
      new_parent_page: parentPage,
      new_heading: section.heading,
      new_checksum: section.checksum,
      git_update_time: gitUpdatedAt,
      check_time: timestamp,
    })
    if (error) {
      throw Error(error.message || 'Error running function to update checksum')
    }
    if (timestamp.toISOString() === new Date(data ?? null).toISOString()) {
      ctx.stats.sectionsUpdated++
    }
  } catch (err) {
    console.error(
      `Failed to update timestamp with checksum for section ${parentPage}:${section.heading}:\n${err}`
    )
    ctx.stats.sectionsErrored++
  }
}

async function getGitUpdatedAt(filePath: string, { git }: { git: SimpleGit }) {
  return (await git.raw('log', '-1', '--format=%cI', filePath)).trim()
}

function getContentDirParentPage(filePath: string) {
  const contentDir = getContentDir()
  return `/content${filePath.replace(contentDir, '')}`
}

main()
