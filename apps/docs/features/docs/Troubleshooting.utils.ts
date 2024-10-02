import matter from 'gray-matter'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { mdxFromMarkdown } from 'mdast-util-mdx'
import { toMarkdown } from 'mdast-util-to-markdown'
import { mdxjs } from 'micromark-extension-mdxjs'
import { readdir, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import toml from 'toml'
import { visit } from 'unist-util-visit'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'

import { DOCS_DIRECTORY } from 'lib/docs'
import { cache_fullProcess_withDevCacheBust } from '~/features/helpers.fs'
import { formatError } from './Troubleshooting.utils.shared'

const TROUBLESHOOTING_DIRECTORY = join(DOCS_DIRECTORY, 'content/troubleshooting')

const TroubleshootingSchema = z
  .object({
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
      .strict()
      .optional(),
    errors: z
      .array(
        z
          .object({
            http_status_code: z.number().optional(),
            code: z.string().optional(),
            message: z.string().optional(),
          })
          .strict()
      )
      .optional(),
    database_id: z.string().uuid().default(uuidv4()),
    created_at: z.date({ coerce: true }).optional(),
    updated_at: z.date({ coerce: true }).optional(),
  })
  .strict()

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

    const mdxTree = fromMarkdown(content, {
      extensions: [mdxjs()],
      mdastExtensions: [mdxFromMarkdown()],
    })
    visit(mdxTree, (node) => {
      if ('children' in node) {
        node.children = node.children.filter(
          (child) =>
            ![
              'mdxJsxFlowExpression',
              'mdxJsxTextExpression',
              'mdxFlowExpression',
              'mdxTextExpression',
              'mdxJsxFlowElement',
              'mdxJsxTextElement',
              'mdxJsxExpressionAttribute',
              'mdxJsxAttribute',
              'mdxJsxAttributeValueExpression',
              'mdxjsEsm',
            ].includes(child.type)
        )
      }
    })
    const contentWithoutJsx = toMarkdown(mdxTree)

    return {
      content,
      contentWithoutJsx,
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
export type ITroubleshootingEntry = Awaited<ReturnType<typeof getAllTroubleshootingEntries>>[number]

export async function getAllTroubleshootingKeywords() {
  const entries = await getAllTroubleshootingEntries()
  const keywords = new Set<string>()
  for (const entry of entries) {
    for (const topic of entry.data.topics) {
      keywords.add(topic)
    }
    for (const keyword of entry.data.keywords ?? []) {
      keywords.add(keyword)
    }
  }
  return Array.from(keywords).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
}

export async function getAllTroubleshootingProducts() {
  const entries = await getAllTroubleshootingEntries()
  const products = new Set<string>()
  for (const entry of entries) {
    for (const topic of entry.data.topics) {
      products.add(topic)
    }
  }
  return Array.from(products).sort((a, b) => a.localeCompare(b))
}

export async function getAllTroubleshootingErrors() {
  const entries = await getAllTroubleshootingEntries()
  const allErrors = new Set(
    entries
      .flatMap((entry) => entry.data.errors)
      .filter((error) => error?.http_status_code || error?.code)
  )

  const seen = new Set<string>()
  for (const error of allErrors) {
    const key = formatError(error)
    if (seen.has(key)) {
      allErrors.delete(error)
    }
    seen.add(key)
  }

  function sortErrors(
    a: ITroubleshootingMetadata['errors'][number],
    b: ITroubleshootingMetadata['errors'][number]
  ) {
    return formatError(a).localeCompare(formatError(b))
  }

  return Array.from(allErrors).sort(sortErrors)
}

export function getArticleSlug(entry: ITroubleshootingMetadata) {
  const slugifiedTitle = entry.title.toLowerCase().replace(/\s+/g, '-')
  const escapedTitle = encodeURIComponent(slugifiedTitle)
  return escapedTitle
}
