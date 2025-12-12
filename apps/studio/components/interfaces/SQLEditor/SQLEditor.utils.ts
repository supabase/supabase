import { generateUuid } from 'lib/api/snippets.browser'
import { removeCommentsFromSql } from 'lib/helpers'
import type { SnippetWithContent } from 'state/sql-editor-v2'
import {
  NEW_SQL_SNIPPET_SKELETON,
  destructiveSqlRegex,
  sqlAiDisclaimerComment,
} from './SQLEditor.constants'
import { ContentDiff } from './SQLEditor.types'

export const createSqlSnippetSkeletonV2 = ({
  name,
  sql,
  owner_id,
  project_id,
  folder_id,
  idOverride,
}: {
  name: string
  sql: string
  owner_id: number
  project_id: number
  folder_id?: string
  /**
   * Optionally, provide a specific snippetId to use for the snippet. This is used to ensure the snippet is created
   * with a known id, such as to prevent flicker in the SQL editor when adding new unsaved snippets.
   */
  idOverride?: string
}): SnippetWithContent => {
  const id = idOverride ?? generateUuid([folder_id, name])

  return {
    ...NEW_SQL_SNIPPET_SKELETON,
    id,
    owner_id,
    project_id,
    name,
    folder_id,
    favorite: false,
    inserted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    content: {
      ...NEW_SQL_SNIPPET_SKELETON.content,
      content_id: id ?? '',
      sql: sql ?? '',
    } as any,
    isNotSavedInDatabaseYet: true,
  }
}

export function checkDestructiveQuery(sql: string) {
  const cleanedSql = removeCommentsFromSql(sql)
  return destructiveSqlRegex.some((regex) => regex.test(cleanedSql))
}

// Function to check for UPDATE queries without WHERE clause
export function isUpdateWithoutWhere(sql: string): boolean {
  const updateWithoutWhereRegex =
    /(?:^|;)\s*update\s+(?:"[\w.]+"\."[\w.]+"|[\w.]+)\s+set\s+[\w\W]+?(?!\s*where\s)/is
  const updateStatements = sql
    .split(';')
    .filter((statement) => statement.trim().toLowerCase().startsWith('update'))
  return updateStatements.some(
    (statement) => updateWithoutWhereRegex.test(statement) && !/where\s/i.test(statement)
  )
}

export const generateMigrationCliCommand = (id: string, name: string, isNpx = false) =>
  `
${isNpx ? 'npx ' : ''}supabase snippets download ${id} |
${isNpx ? 'npx ' : ''}supabase migration new ${name}
`.trim()

export const generateSeedCliCommand = (id: string, isNpx = false) =>
  `
${isNpx ? 'npx ' : ''}supabase snippets download ${id} >> \\
  supabase/seed.sql
`.trim()

export const generateFileCliCommand = (id: string, name: string, isNpx = false) =>
  `
${isNpx ? 'npx ' : ''}supabase snippets download ${id} > \\
  ${name}.sql
`.trim()

export const compareAsModification = (sqlDiff: ContentDiff) => {
  const formattedModified = sqlDiff.modified.replace(sqlAiDisclaimerComment, '').trim()

  return {
    original: sqlDiff.original,
    modified: `${formattedModified}`,
  }
}

export const compareAsAddition = (sqlDiff: ContentDiff) => {
  const formattedOriginal = sqlDiff.original.replace(sqlAiDisclaimerComment, '').trim()
  const formattedModified = sqlDiff.modified.replace(sqlAiDisclaimerComment, '').trim()
  const newModified = (formattedOriginal ? formattedOriginal + '\n\n' : '') + formattedModified

  return {
    original: sqlDiff.original,
    modified: newModified,
  }
}

export const compareAsNewSnippet = (sqlDiff: ContentDiff) => {
  return {
    original: '',
    modified: sqlDiff.modified,
  }
}

// [Joshen] Just FYI as well the checks here on whether to append limit is quite restricted
// This is to prevent dashboard from accidentally appending limit to the end of a query
// thats not supposed to have any, since there's too many cases to cover.
// We can however look into making this logic better in the future
// i.e It's harder to append the limit param, than just leaving the query as it is
// Otherwise we'd need a full on parser to do this properly
export const checkIfAppendLimitRequired = (sql: string, limit: number = 0) => {
  // Remove lines and whitespaces to use for checking
  const cleanedSql = sql.trim().replaceAll('\n', ' ').replaceAll(/\s+/g, ' ')

  // Check how many queries
  const regMatch = cleanedSql.matchAll(/[a-zA-Z]*[0-9]*[;]+/g)
  const queries = new Array(...regMatch)
  const indexSemiColon = cleanedSql.lastIndexOf(';')
  const hasComments = cleanedSql.includes('--')
  const hasMultipleQueries =
    queries.length > 1 || (indexSemiColon > 0 && indexSemiColon !== cleanedSql.length - 1)

  // Check if need to auto limit rows
  const appendAutoLimit =
    limit > 0 &&
    !hasComments &&
    !hasMultipleQueries &&
    cleanedSql.toLowerCase().startsWith('select') &&
    !cleanedSql.toLowerCase().match(/fetch\s+first/i) &&
    !cleanedSql.match(/limit$/i) &&
    !cleanedSql.match(/limit;$/i) &&
    !cleanedSql.match(/limit [0-9]* offset [0-9]*[;]?$/i) &&
    !cleanedSql.match(/limit [0-9]*[;]?$/i)
  return { cleanedSql, appendAutoLimit }
}

export const suffixWithLimit = (sql: string, limit: number = 0) => {
  const { cleanedSql, appendAutoLimit } = checkIfAppendLimitRequired(sql, limit)
  const formattedSql = appendAutoLimit
    ? cleanedSql.endsWith(';')
      ? sql.replace(/[;]+$/, ` limit ${limit};`)
      : `${sql} limit ${limit};`
    : sql
  return formattedSql
}
