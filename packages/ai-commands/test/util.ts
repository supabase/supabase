import { parseQuery } from '@gregnr/libpg-query'
import { fromMarkdown } from 'mdast-util-from-markdown'
import type { Code } from 'mdast-util-from-markdown/lib'
import { format } from 'sql-formatter'

declare global {
  interface ReadableStream<R = any> {
    [Symbol.asyncIterator](): AsyncIterableIterator<R>
  }
}

export type PolicyInfo = {
  name: string
  table: string
  command?: string
  usingExpression?: string
  checkExpression?: string
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

/**
 * Parses a Postgres SQL policy.
 *
 * @returns Information about the policy, including its name, table, command, and expressions.
 */
export async function getPolicyInfo(sql: string) {
  const result = await parseQuery(sql)

  if (result.stmts.length === 0) {
    throw new Error('Expected a statement, but received none')
  }

  if (result.stmts.length > 1) {
    throw new Error('Expected a single statement, but received multiple')
  }

  const [{ stmt }] = result.stmts

  const createPolicyStatement = stmt.CreatePolicyStmt

  if (!createPolicyStatement) {
    throw new Error('Expected a create policy statement')
  }

  const formattedSql = formatSql(sql)

  const usingMatch = formattedSql.match(/using\s*\((.*)\)/is)
  let usingExpression
  if (usingMatch) {
    usingExpression = usingMatch[1]
  }

  const withCheckMatch = formattedSql.match(/with check\s*\((.*)\)/is)
  let checkExpression
  if (withCheckMatch) {
    checkExpression = withCheckMatch[1]
  }

  const policyInfo: PolicyInfo = {
    name: createPolicyStatement.policy_name,
    table: createPolicyStatement.table.relname,
    command: createPolicyStatement.cmd_name,
    usingExpression,
    checkExpression,
  }

  return policyInfo
}
