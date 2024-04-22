import { removeCommentsFromSql } from 'lib/helpers'
import type { SqlSnippets, UserContent } from 'types'
import {
  NEW_SQL_SNIPPET_SKELETON,
  destructiveSqlRegex,
  sqlAiDisclaimerComment,
} from './SQLEditor.constants'
import { ContentDiff, DiffType } from './SQLEditor.types'

export const createSqlSnippetSkeleton = ({
  id,
  name,
  sql,
  owner_id,
  project_id,
}: {
  id?: string
  name?: string
  sql?: string
  owner_id?: number
  project_id?: number
} = {}): UserContent<SqlSnippets.Content> => {
  return {
    ...NEW_SQL_SNIPPET_SKELETON,
    id,
    ...(name && { name }),
    ...(owner_id && { owner_id }),
    ...(project_id && { project_id }),
    content: {
      ...NEW_SQL_SNIPPET_SKELETON.content,
      content_id: id ?? '',
      sql: sql ?? '',
    },
  }
}

export function getDiffTypeButtonLabel(diffType: DiffType) {
  switch (diffType) {
    case DiffType.Modification:
      return 'Accept change'
    case DiffType.Addition:
      return 'Accept addition'
    case DiffType.NewSnippet:
      return 'Create new snippet'
    default:
      throw new Error(`Unknown diff type '${diffType}'`)
  }
}

export function getDiffTypeDropdownLabel(diffType: DiffType) {
  switch (diffType) {
    case DiffType.Modification:
      return 'Compare as change'
    case DiffType.Addition:
      return 'Compare as addition'
    case DiffType.NewSnippet:
      return 'Compare as new snippet'
    default:
      throw new Error(`Unknown diff type '${diffType}'`)
  }
}

export function checkDestructiveQuery(sql: string) {
  return destructiveSqlRegex.some((regex) => regex.test(removeCommentsFromSql(sql)))
}

export const generateMigrationCliCommand = (id: string, name: string, isNpx = false) => `
${isNpx ? 'npx ' : ''}supabase snippets download ${id} |
${isNpx ? 'npx ' : ''}supabase migration new ${name}
`

export const generateSeedCliCommand = (id: string, isNpx = false) => `
${isNpx ? 'npx ' : ''}supabase snippets download ${id} >> \\
  supabase/seed.sql
`

export const generateFileCliCommand = (id: string, name: string, isNpx = false) => `
${isNpx ? 'npx ' : ''}supabase snippets download ${id} > \\
  ${name}.sql
`

export const compareAsModification = (sqlDiff: ContentDiff) => {
  const formattedModified = sqlDiff.modified.replace(sqlAiDisclaimerComment, '').trim()

  return {
    original: sqlDiff.original,
    modified: `${sqlAiDisclaimerComment}\n\n${formattedModified}`,
  }
}

export const compareAsAddition = (sqlDiff: ContentDiff) => {
  const formattedOriginal = sqlDiff.original.replace(sqlAiDisclaimerComment, '').trim()
  const formattedModified = sqlDiff.modified.replace(sqlAiDisclaimerComment, '').trim()
  const newModified =
    sqlAiDisclaimerComment +
    '\n\n' +
    (formattedOriginal ? formattedOriginal + '\n\n' : '') +
    formattedModified

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
