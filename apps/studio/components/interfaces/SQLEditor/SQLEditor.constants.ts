import { untrustedSql } from '@supabase/pg-meta'
import { IS_PLATFORM } from 'common'

import type { SqlSnippets, UserContent } from '@/types'

const SQL_SNIPPET_SCHEMA_VERSION = '1.0'

export const NEW_SQL_SNIPPET_SKELETON: UserContent<SqlSnippets.Content> = {
  name: 'New Query',
  description: '',
  type: 'sql',
  visibility: 'user', // default to user scope
  favorite: false,
  content: {
    schema_version: SQL_SNIPPET_SCHEMA_VERSION,
    content_id: '',
    unchecked_sql: untrustedSql(''),
  },
}

export const sqlAiDisclaimerComment = `
-- Supabase AI is experimental and may produce incorrect answers
-- Always verify the output before executing
`.trim()

// Should only be used for comparisons. If you need a new title, use generateSnippetTitle()
export const untitledSnippetTitle = 'Untitled query'

/**
 * Generates a snippet title. If the platform is self-hosted, it will return a random number to avoid conflicts.
 */
export const generateSnippetTitle = () => {
  if (IS_PLATFORM) {
    return untitledSnippetTitle
  } else {
    return `${untitledSnippetTitle} ${Math.floor(Math.random() * 900) + 100}`
  }
}

export const destructiveSqlRegex = [
  // Direct destructive statements at top level or after semicolon
  /^(.*;)?\s*(drop|delete|truncate|alter\s+table\s+.*\s+drop\s+column)\s/is,
  // EXECUTE with string literal: EXECUTE 'DROP TABLE ...' or EXECUTE 'ALTER TABLE ... DROP COLUMN ...'
  /execute\s+(?:format\s*\([^)]*\)\s*\|\||[^;]*['"])\s*(?:(drop|delete|truncate)\b|alter\s+table[^;]*\bdrop\s+column\b)/is,
  // EXECUTE format(): EXECUTE format('DROP TABLE %I', ...)
  /execute\s+format\s*\([^)]*['"]\s*(?:(drop|delete|truncate)\b|alter\s+table[^;]*\bdrop\s+column\b)/is,
  // EXECUTE IMMEDIATE (Oracle compatibility via orafce)
  /execute\s+immediate\s+['"]\s*(?:(drop|delete|truncate)\b|alter\s+table[^;]*\bdrop\s+column\b)/is,
  // OPEN cursor FOR EXECUTE
  /open\s+\w+\s+for\s+execute\s+(?:format\s*\([^)]*\)\s*\|\||[^;]*['"])\s*(?:(drop|delete|truncate)\b|alter\s+table[^;]*\bdrop\s+column\b)/is,
  // OPEN cursor FOR EXECUTE format()
  /open\s+\w+\s+for\s+execute\s+format\s*\([^)]*['"]\s*(?:(drop|delete|truncate)\b|alter\s+table[^;]*\bdrop\s+column\b)/is,
  // RETURN QUERY EXECUTE
  /return\s+query\s+execute\s+(?:format\s*\([^)]*\)\s*\|\||[^;]*['"])\s*(?:(drop|delete|truncate)\b|alter\s+table[^;]*\bdrop\s+column\b)/is,
  // RETURN QUERY EXECUTE format()
  /return\s+query\s+execute\s+format\s*\([^)]*['"]\s*(?:(drop|delete|truncate)\b|alter\s+table[^;]*\bdrop\s+column\b)/is,
  // EXECUTE with dollar-quoted string: EXECUTE $tag$DROP TABLE$tag$
  /execute\s+\$\w*\$\s*(?:(drop|delete|truncate)\b|alter\s+table[^;]*\bdrop\s+column\b)/is,
  // EXECUTE concat() / concat_ws()
  /execute\s+concat(?:_ws)?\s*\([^)]*\b(?:(drop|delete|truncate)|alter\s+table[^)]*\bdrop\s+column\b)/i,
  // EXECUTE with E'' escape strings: EXECUTE E'DROP TABLE ...'
  /execute\s+e['"]\s*(?:(drop|delete|truncate)\b|alter\s+table[^;]*\bdrop\s+column\b)/is,
]

// Matches `UPDATE <table> SET ...` where <table> is any combination of bareword
// or double-quoted identifiers, optionally schema-qualified. Quoted identifiers
// can contain any character (including spaces) and use `""` to escape an inner
// quote, mirroring Postgres syntax.
export const updateWithoutWhereRegex =
  /(?:^|;)\s*update\s+(?:"(?:[^"]|"")+"|[\w]+)(?:\.(?:"(?:[^"]|"")+"|[\w]+))?\s+set\s+[\w\W]+?(?!\s*where\s)/is

export const alterDatabasePreventConnectionStatements = [
  'alter database postgres connection limit 0',
  'alter database postgres allow_connections false',
]

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
