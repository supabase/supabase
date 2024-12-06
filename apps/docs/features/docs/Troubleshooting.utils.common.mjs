/**
 * This file is for utils needed in both the Next.js app build and the
 * troubleshooting sync script. Because of unsolved problems with imports, the
 * script is a mjs file instead of a ts file. Any dependencies that are needed
 * in both places are defined here, and then typed in Troubleshooting.utils.ts
 * as required.
 */

import matter from 'gray-matter'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown, gfmToMarkdown } from 'mdast-util-gfm'
import { mdxFromMarkdown } from 'mdast-util-mdx'
import { toMarkdown } from 'mdast-util-to-markdown'
import { gfm } from 'micromark-extension-gfm'
import { mdxjs } from 'micromark-extension-mdxjs'
import { readdir, readFile, stat } from 'node:fs/promises'
import { join, sep } from 'node:path'
import toml from 'toml'
import { visit } from 'unist-util-visit'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'

export const TROUBLESHOOTING_DIRECTORY = join(process.cwd(), 'content/troubleshooting')

/**
 * @typedef {Object} TroubleshootingEntry
 * @property {string} filePath
 * @property {string} content
 * @property {string} contentWithoutJsx
 * @property {TroubleshootingMetadata} data
 */

/**
 * @typedef {Object} TroubleshootingMetadata
 * @property {string} title
 * @property {string[]} topics
 * @property {string[]} [keywords]
 * @property {Object} [api]
 * @property {string[]} [api.sdk]
 * @property {string[]} [api.management_api]
 * @property {string[]} [api.cli]
 * @property {AssociatedError[]} [errors]
 * @property {string} database_id
 * @property {string} [github_url]
 * @property {Date} [date_created]
 */

/**
 * @typedef {Object} AssociatedError
 * @property {number} [http_status_code]
 * @property {string} [code]
 * @property {string} [message]
 */

export const TroubleshootingSchema = z
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
    database_id: z.string().default(`pseudo-${uuidv4()}`),
    github_url: z.string().url().optional(),
    date_created: z.date({ coerce: true }).optional(),
  })
  .strict()

/*
 * @param {unknown} troubleshootingMetadata
 */
function validateTroubleshootingMetadata(troubleshootingMetadata) {
  return TroubleshootingSchema.safeParse(troubleshootingMetadata)
}

/*
 * @returns {Promise<TroubleshootingEntry[]>}
 */
export async function getAllTroubleshootingEntriesInternal() {
  const troubleshootingDirectoryContents = await readdir(TROUBLESHOOTING_DIRECTORY, {
    recursive: true,
  })
  const troubleshootingFiles = troubleshootingDirectoryContents.map(async (entry) => {
    const isHidden = entry.startsWith('_')
    if (isHidden) return null

    const filePath = join(TROUBLESHOOTING_DIRECTORY, entry)

    const isFile = (await stat(filePath)).isFile()
    if (!isFile) return null

    const fileContents = await readFile(filePath, 'utf-8')
    const { content, data: frontmatter } = matter(fileContents, {
      language: 'toml',
      engines: { toml: toml.parse.bind(toml) },
    })

    const parseResult = validateTroubleshootingMetadata(frontmatter)
    if ('error' in parseResult) {
      console.error(
        `Error validating troubleshooting metadata\nEntry:%O\nError:%O`,
        frontmatter,
        parseResult.error
      )
      return null
    }

    const mdxTree = fromMarkdown(content, {
      extensions: [gfm(), mdxjs()],
      mdastExtensions: [gfmFromMarkdown(), mdxFromMarkdown()],
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
    const contentWithoutJsx = toMarkdown(mdxTree, {
      extensions: [gfmToMarkdown()],
    })

    return {
      filePath,
      content,
      contentWithoutJsx,
      data: parseResult.data,
    }
  })

  return (await Promise.all(troubleshootingFiles)).filter(Boolean)
}

/**
 * @param {TroubleshootingEntry} entry
 */
export function getArticleSlug(entry) {
  const parts = entry.filePath.split(sep)
  return parts[parts.length - 1].replace(/\.mdx$/, '')
}
