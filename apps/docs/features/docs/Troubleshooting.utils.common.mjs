// @ts-check

/**
 * This file is for utils needed in both the Next.js app build and the
 * troubleshooting sync script. Because of unsolved problems with imports, the
 * script is a mjs file instead of a ts file. Any dependencies that are needed
 * in both places are defined here, and then typed in Troubleshooting.utils.ts
 * as required.
 */

import { readdir, readFile, stat } from 'node:fs/promises'
import { join, sep } from 'node:path'
import matter from 'gray-matter'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown, gfmToMarkdown } from 'mdast-util-gfm'
import { mdxFromMarkdown } from 'mdast-util-mdx'
import { toMarkdown } from 'mdast-util-to-markdown'
import { gfm } from 'micromark-extension-gfm'
import { mdxjs } from 'micromark-extension-mdxjs'
import { parse } from 'smol-toml'
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
 * @property {string} summary
 * @property {TroubleshootingDiagnosticSource[]} diagnostic_sources
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

/**
 * @typedef {keyof typeof TROUBLESHOOTING_DIAGNOSTIC_SOURCES} TroubleshootingDiagnosticSource
 */

export const TROUBLESHOOTING_DIAGNOSTIC_SOURCES = /** @type {const} */ ({
  'logs-explorer': 'Logs Explorer',
  'api-logs': 'API logs',
  'postgres-logs': 'Postgres logs',
  'supavisor-logs': 'Supavisor logs',
  'auth-logs': 'Auth logs',
  'storage-logs': 'Storage logs',
  'realtime-logs': 'Realtime logs',
  'edge-function-logs': 'Edge Function logs',
  metrics: 'Metrics',
  reports: 'Reports',
  'security-advisor': 'Security Advisor',
  'performance-advisor': 'Performance Advisor',
  'database-inspection': 'Database inspection',
  'client-tracing': 'Client tracing',
  'log-drains': 'Log drains',
})

const TROUBLESHOOTING_DIAGNOSTIC_SOURCE_IDS = /** @type {[
 *   TroubleshootingDiagnosticSource,
 *   ...TroubleshootingDiagnosticSource[],
 * ]} */ (Object.keys(TROUBLESHOOTING_DIAGNOSTIC_SOURCES))

export const TroubleshootingSchema = z
  .object({
    title: z.string(),
    topics: z
      .array(
        z.enum([
          'ai',
          'ai-tools',
          'api',
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
      )
      .min(1),
    keywords: z.array(z.string()).optional(),
    summary: z.string().min(1),
    diagnostic_sources: z.array(z.enum(TROUBLESHOOTING_DIAGNOSTIC_SOURCE_IDS)).min(1),
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

/**
 * @param {unknown} troubleshootingMetadata
 */
function validateTroubleshootingMetadata(troubleshootingMetadata) {
  return TroubleshootingSchema.safeParse(troubleshootingMetadata)
}

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
      engines: { toml: parse },
    })

    const parseResult = validateTroubleshootingMetadata(frontmatter)
    if ('error' in parseResult) {
      throw Error(`Error validating troubleshooting metadata for ${filePath}`, {
        cause: parseResult.error,
      })
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

      if (node.type === 'link' || node.type === 'image') {
        canonicalizeUrl(node)
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

  return (await Promise.all(troubleshootingFiles)).filter((x) => x != null)
}

/**
 *
 * @param {import('mdast').Image | import('mdast').Link} node
 */
function canonicalizeUrl(node) {
  if (node.url.startsWith('/')) {
    node.url === 'https://supabase.com' + node.url
  }
}

/**
 * @param {TroubleshootingEntry} entry
 */
export function getArticleSlug(entry) {
  const parts = entry.filePath.split(sep)
  return parts[parts.length - 1].replace(/\.mdx$/, '')
}
