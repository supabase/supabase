import type { Monaco } from '@monaco-editor/react'
import type { editor, languages } from 'monaco-editor'
import { describe, expect, it } from 'vitest'

import { getPgsqlCompletionProvider } from './PgSQLCompletionProvider'
import type { PgInfo } from './Providers.types'

// A minimal stand-in for the parts of `Monaco` this provider actually reads.
const monaco = {
  languages: {
    CompletionItemKind: {
      Keyword: 1,
      Class: 2,
      Interface: 3,
      Field: 4,
      Function: 5,
      Property: 6,
    },
  },
} as unknown as Monaco

function createModel(sql: string): editor.ITextModel {
  return {
    getValue: () => sql,
    getOffsetAt: () => sql.length,
    getWordUntilPosition: () => ({
      word: '',
      startColumn: sql.length + 1,
      endColumn: sql.length + 1,
    }),
  } as unknown as editor.ITextModel
}

type ProvideCompletionItemsParams = Parameters<
  languages.CompletionItemProvider['provideCompletionItems']
>

function createPosition(sql: string): ProvideCompletionItemsParams[1] {
  // Monaco columns are 1-indexed; column = length + 1 places the cursor at the end.
  return { column: sql.length + 1, lineNumber: 1 } as unknown as ProvideCompletionItemsParams[1]
}

// Minimal fixtures — only the fields this provider reads, cast to the real (much larger) zod types.
function createPgInfoRef(): { current: PgInfo } {
  return {
    current: {
      keywords: ['abort', 'absent', 'absolute'],
      schemas: [{ name: 'public' }] as unknown as PgInfo['schemas'],
      functions: [
        { name: '_crypto_aead_det_decrypt', return_type: 'bytea' },
      ] as unknown as PgInfo['functions'],
      tableColumns: [
        {
          schemaname: 'public',
          tablename: 'colors',
          quoted_name: 'colors',
          is_table: true,
          columns: [
            { attname: 'id', data_type: 'bigint' },
            { attname: 'hex', data_type: 'text' },
          ],
        },
        {
          schemaname: 'public',
          tablename: 'shapes',
          quoted_name: 'shapes',
          is_table: true,
          columns: [{ attname: 'sides', data_type: 'smallint' }],
        },
      ],
    },
  }
}

function getSuggestions(pgInfoRef: { current: PgInfo }, sql: string): languages.CompletionItem[] {
  return provideSuggestions(pgInfoRef, sql, ' ')
}

function getDotSuggestions(
  pgInfoRef: { current: PgInfo },
  sql: string
): languages.CompletionItem[] {
  return provideSuggestions(pgInfoRef, sql, '.')
}

function provideSuggestions(
  pgInfoRef: { current: PgInfo },
  sql: string,
  triggerCharacter: string
): languages.CompletionItem[] {
  const provider = getPgsqlCompletionProvider(monaco, pgInfoRef)
  const context = { triggerCharacter } as unknown as ProvideCompletionItemsParams[2]
  const token = {} as ProvideCompletionItemsParams[3]

  const result = provider.provideCompletionItems(
    createModel(sql),
    createPosition(sql),
    context,
    token
  ) as languages.CompletionList

  return result.suggestions
}

describe('getPgsqlCompletionProvider - default scenario', () => {
  it('suggests only the FROM-clause table columns, ranked above keywords/functions', () => {
    const pgInfoRef = createPgInfoRef()
    const suggestions = getSuggestions(pgInfoRef, 'select * from colors where ')

    const columnSuggestions = suggestions.filter(
      (s) => s.kind === monaco.languages.CompletionItemKind.Field
    )
    expect(columnSuggestions.map((s) => s.label).sort()).toStrictEqual(['hex', 'id'])

    // Every in-scope column must be ranked (sortText) ahead of keywords/functions
    columnSuggestions.forEach((s) => expect(s.sortText).toMatch(/^0_/))
    const nonColumnSuggestions = suggestions.filter(
      (s) => s.kind !== monaco.languages.CompletionItemKind.Field
    )
    nonColumnSuggestions.forEach((s) => expect(s.sortText).toBeUndefined())
  })

  it('falls back to every table column when no FROM clause is resolved yet', () => {
    const pgInfoRef = createPgInfoRef()
    const suggestions = getSuggestions(pgInfoRef, 'select ')

    const columnSuggestions = suggestions.filter(
      (s) => s.kind === monaco.languages.CompletionItemKind.Field
    )
    expect(columnSuggestions.map((s) => s.label).sort()).toStrictEqual(['hex', 'id', 'sides'])
    columnSuggestions.forEach((s) => expect(s.sortText).toBeUndefined())
  })

  it('narrows columns per-table across a join', () => {
    const pgInfoRef = createPgInfoRef()
    const suggestions = getSuggestions(
      pgInfoRef,
      'select * from colors c join shapes s on s.id = c.id where '
    )

    const columnSuggestions = suggestions.filter(
      (s) => s.kind === monaco.languages.CompletionItemKind.Field
    )
    expect(columnSuggestions.map((s) => s.label).sort()).toStrictEqual(['hex', 'id', 'sides'])
  })

  it('scopes to a single alias when the statement ends with `alias.`', () => {
    const pgInfoRef = createPgInfoRef()
    const suggestions = getSuggestions(
      pgInfoRef,
      'select * from colors c join shapes s on s.id = c.id where c.'
    )

    const columnSuggestions = suggestions.filter(
      (s) => s.kind === monaco.languages.CompletionItemKind.Field
    )
    expect(columnSuggestions.map((s) => s.label).sort()).toStrictEqual(['hex', 'id'])
  })
})

describe('getPgsqlCompletionProvider - dot scenario', () => {
  it('scopes to a table alias in a single-table query', () => {
    const pgInfoRef = createPgInfoRef()
    const suggestions = getDotSuggestions(pgInfoRef, 'select * from colors c where c.')
    expect(suggestions.map((s) => s.label).sort()).toStrictEqual(['hex', 'id'])
  })

  it('scopes to the aliased table only, not every table joined in', () => {
    const pgInfoRef = createPgInfoRef()
    const suggestions = getDotSuggestions(
      pgInfoRef,
      'select * from colors c join shapes s on s.id = c.id where c.'
    )
    expect(suggestions.map((s) => s.label).sort()).toStrictEqual(['hex', 'id'])
  })

  it('still resolves a plain (un-aliased) table name', () => {
    const pgInfoRef = createPgInfoRef()
    const suggestions = getDotSuggestions(
      pgInfoRef,
      'select * from colors join shapes s on s.id = colors.id where colors.'
    )
    expect(suggestions.map((s) => s.label).sort()).toStrictEqual(['hex', 'id'])
  })

  it('resolves an alias when there is no `public` schema at all', () => {
    const pgInfoRef: { current: PgInfo } = {
      current: {
        keywords: [],
        schemas: [{ name: 'app' }] as unknown as PgInfo['schemas'],
        functions: [] as unknown as PgInfo['functions'],
        tableColumns: [
          {
            schemaname: 'app',
            tablename: 'colors',
            quoted_name: 'colors',
            is_table: true,
            columns: [
              { attname: 'id', data_type: 'bigint' },
              { attname: 'hex', data_type: 'text' },
            ],
          },
        ],
      },
    }
    const suggestions = getDotSuggestions(pgInfoRef, 'select * from app.colors c where c.')
    expect(suggestions.map((s) => s.label).sort()).toStrictEqual(['hex', 'id'])
  })
})
