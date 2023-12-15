import { fromMarkdown } from 'mdast-util-from-markdown'
import type { Code } from 'mdast-util-from-markdown/lib'
import { format } from 'sql-formatter'

declare global {
  interface ReadableStream<R = any> {
    [Symbol.asyncIterator](): AsyncIterableIterator<R>
  }
}

/**
 * Formats Postgres SQL into a consistent format.
 *
 * @returns The formatted SQL.
 */
export const formatSql = (sql: string) =>
  format(sql, { language: 'postgresql', keywordCase: 'lower' })

/**
 * Collects an `ArrayBuffer` stream into a single decoded string.
 *
 * @returns A single string combining all the decoded stream chunks.
 */
export async function collectStream<R extends BufferSource>(stream: ReadableStream<R>) {
  const textDecoderStream = new TextDecoderStream()

  let content = ''

  for await (const chunk of stream.pipeThrough(textDecoderStream)) {
    content += chunk
  }

  return content
}

/**
 * Parses markdown and extracts all SQL code blocks.
 *
 * @returns An array of string content from each SQL code block.
 */
export function extractMarkdownSql(markdown: string) {
  const mdTree = fromMarkdown(markdown)

  return mdTree.children
    .filter((node): node is Code => node.type === 'code' && node.lang === 'sql')
    .map(({ value }) => value)
}
