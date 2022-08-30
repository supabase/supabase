import { SqlSnippets, UserContent } from 'types'

export const SQL_SNIPPET_SCHEMA_VERSION = '1.0'

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
