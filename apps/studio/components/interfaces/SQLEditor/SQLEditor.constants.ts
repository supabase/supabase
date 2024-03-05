import type { SqlSnippets, UserContent } from 'types'

const SQL_SNIPPET_SCHEMA_VERSION = '1.0'

export const NEW_SQL_SNIPPET_SKELETON: UserContent<SqlSnippets.Content> = {
  name: 'New Query',
  description: '',
  type: 'sql',
  visibility: 'user', // default to user scope
  content: {
    schema_version: SQL_SNIPPET_SCHEMA_VERSION,
    content_id: '',
    sql: 'this is a test',
    favorite: false,
  },
}

export const sqlAiDisclaimerComment = `
-- Supabase AI is experimental and may produce incorrect answers
-- Always verify the output before executing
`.trim()

export const untitledSnippetTitle = 'Untitled query'

export const destructiveSqlRegex = [/^(.*;)?\s*(drop|delete|truncate)\s/is]
