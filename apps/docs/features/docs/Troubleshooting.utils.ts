import matter from 'gray-matter'
import { readdir, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import toml from 'toml'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'

import { DOCS_DIRECTORY } from 'lib/docs'
import { cache_fullProcess_withDevCacheBust } from '../helpers.fs'

const TROUBLESHOOTING_DIRECTORY = join(DOCS_DIRECTORY, 'content/troubleshooting')

const TroubleshootingSchema = z.object({
  title: z.string(),
  topics: z.array(
    z.enum([
      'ai',
      'auth',
      'branching',
      'cli',
      'database',
      'functions',
      'platform',
      'realtime',
      'self-hosting',
      'storage',
      'studio',
      'supavisor',
      'terraform',
    ])
  ),
  keywords: z.array(z.string()).optional(),
  api: z
    .object({
      sdk: z.array(z.string()).optional(),
      management_api: z.array(z.string()).optional(),
      cli: z.array(z.string()).optional(),
    })
    .optional(),
  errors: z
    .array(
      z.object({
        httpStatusCode: z.number().optional(),
        code: z.string().optional(),
        message: z.string().optional(),
      })
    )
    .optional(),
  database_id: z.string().uuid().default(uuidv4()),
  createdAt: z.date({ coerce: true }).optional(),
  updatedAt: z.date({ coerce: true }).optional(),
})

export type ITroubleshootingMetadata = z.infer<typeof TroubleshootingSchema>

const validateTroubleshootingMetadata = (troubleshootingMetadata: unknown) => {
  return TroubleshootingSchema.safeParse(troubleshootingMetadata)
}

async function getAllTroubleshootingEntriesInternal() {
  const troubleshootingDirectoryContents = await readdir(TROUBLESHOOTING_DIRECTORY, {
    recursive: true,
  })
  const troubleshootingFiles = troubleshootingDirectoryContents.map(async (entry) => {
    const isHidden = entry.startsWith('_')
    if (isHidden) return null

    const isFile = (await stat(join(TROUBLESHOOTING_DIRECTORY, entry))).isFile()
    if (!isFile) return null

    const fileContents = await readFile(join(TROUBLESHOOTING_DIRECTORY, entry), 'utf-8')
    const { content, data: frontmatter } = matter(fileContents, {
      language: 'toml',
      engines: { toml: toml.parse.bind(toml) },
    })

    const parseResult = validateTroubleshootingMetadata(frontmatter)
    if ('error' in parseResult) {
      console.error(`Error validating troubleshooting metadata for ${entry}:`, parseResult.error)
      return null
    }

    return {
      content,
      data: parseResult.data,
    }
  })

  return (await Promise.all(troubleshootingFiles)).filter(Boolean)
}

export const getAllTroubleshootingEntries = cache_fullProcess_withDevCacheBust(
  getAllTroubleshootingEntriesInternal,
  TROUBLESHOOTING_DIRECTORY,
  () => JSON.stringify([])
)
