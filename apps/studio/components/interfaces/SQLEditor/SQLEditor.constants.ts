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

export const ASSISTANT_TEMPLATES = [
  {
    name: 'Twitter clone',
    description: 'Simplified schema that mimics the Twitter application',
    prompt: 'Create a twitter clone',
  },
  {
    name: 'Chat application',
    description: 'Send messages through channels or direct messages',
    prompt:
      'Create a chat application that supports sending messages either through channels or directly between users',
  },
  {
    name: 'User management schema',
    description: 'With role based access control',
    prompt: 'Create a simple user management schema that supports role based access control',
  },
  {
    name: 'Countries and Cities',
    description: 'With each city belonging to a country',
    prompt:
      'Create a table of countries and a table of cities, with each city belonging to a country',
  },
]

export const ROWS_PER_PAGE_OPTIONS = [
  { value: -1, label: 'No limit' },
  { value: 100, label: '100 rows' },
  { value: 500, label: '500 rows' },
  { value: 1000, label: '1,000 rows' },
]
