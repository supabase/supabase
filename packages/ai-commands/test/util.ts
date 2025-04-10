import chalk from 'chalk'
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
    const text = chunk.split('0:')[1]
    content += text.slice(1, text.length - 2)
  }

  return content.replaceAll('\\n', '\n').replaceAll('\\"', '"')
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

/**
 * Prints the provided metadata along with any assertion errors.
 * Works both synchronously and asynchronously.
 *
 * Useful for providing extra context for failed tests.
 */
export function withMetadata<T extends void | Promise<void>>(
  metadata: Record<string, string>,
  fn: () => T
): T {
  /**
   * Prepends metadata to an Error's stack trace.
   */
  function modifyError(err: unknown) {
    if (err instanceof Error && err.stack) {
      const formattedMetadata = Object.entries(metadata).map(
        ([key, value]) => `${chalk.bold.dim(key)}:\n\n${chalk.green.dim(value)}`
      )
      err.stack = `${formattedMetadata.join('\n\n')}\n\n${err.stack}`
    }

    return err
  }

  // Execute the function and handle both
  // synchronous or asynchronous scenarios
  try {
    const maybePromise = fn()

    if (maybePromise instanceof Promise) {
      return maybePromise.catch((err) => {
        // Re-throw the error
        throw modifyError(err)
      }) as T
    }
    return maybePromise
  } catch (err) {
    // Re-throw the error
    throw modifyError(err)
  }
}
