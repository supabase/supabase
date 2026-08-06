import type { Monaco } from '@monaco-editor/react'
import type { editor, languages, Position } from 'monaco-editor'
import type { RefObject } from 'react'

import BackwardIterator from './BackwardIterator'
import {
  filterTablesByReferences,
  getFromClauseTables,
  getStatementAtOffset,
  parseTrailingDotIdent,
  resolveTablesForIdent,
} from './PgSQLCompletionProvider.utils'
import type { PgInfo } from './Providers.types'
import type { SavedDatabaseFunction } from '@/data/database-functions/database-functions-query'
import type { Schema } from '@/data/database/schemas-query'
import type { TableColumn } from '@/data/database/table-columns-query'

type TableColumnField = {
  attname: string
  data_type: string
}

type QuotableIdent = {
  isQuoted: boolean
  name: string
}

const EMPTY_IDENT: QuotableIdent = { isQuoted: false, name: '' }

export function getPgsqlCompletionProvider(
  monaco: Monaco,
  pgInfoRef: RefObject<PgInfo | null>
): languages.CompletionItemProvider {
  return {
    triggerCharacters: [' ', '.', '"'],
    provideCompletionItems: function (
      model: editor.ITextModel,
      position: Position,
      context: languages.CompletionContext
    ) {
      try {
        const pgInfo = pgInfoRef.current
        if (!pgInfo) return { suggestions: [] }

        // position.column should minus 2 as it returns 2 for first char
        // position.lineNumber should minus 1
        const iterator = new BackwardIterator(model, position.column - 2, position.lineNumber - 1)
        const range = getReplacementRange(model, position)
        const statement = getStatementAtOffset(model.getValue(), model.getOffsetAt(position))

        if (context.triggerCharacter === '"') {
          return startingQuoteScenarioSuggestions(monaco, pgInfo, iterator, range)
        } else if (context.triggerCharacter === '.') {
          return dotScenarioSuggestions(monaco, pgInfo, iterator, range, statement)
        } else {
          return defaultScenarioSuggestions(monaco, pgInfo, statement, range)
        }
      } catch (_) {
        // any error, returns empty suggestion
        return { suggestions: [] }
      }
    },
  }
}

// Monaco requires a range on every completion item; when one isn't supplied it falls back to
// replacing the current word anyway, so we compute that explicitly rather than leave it implicit.
function getReplacementRange(
  model: editor.ITextModel,
  position: Position
): languages.CompletionItem['range'] {
  const word = model.getWordUntilPosition(position)
  return {
    startLineNumber: position.lineNumber,
    endLineNumber: position.lineNumber,
    startColumn: word.startColumn,
    endColumn: word.endColumn,
  }
}

function startingQuoteScenarioSuggestions(
  monaco: Monaco,
  pgInfo: PgInfo,
  iterator: BackwardIterator,
  range: languages.CompletionItem['range']
) {
  const items: languages.CompletionItem[] = []

  const startingQuotedIdent = iterator.isFowardDQuote()
  if (!startingQuotedIdent) return { suggestions: items }

  iterator.next() // get passed the starting quote
  if (iterator.isNextPeriod()) {
    // probably a field - get the ident
    let ident = iterator.readIdent()
    let isQuotedIdent = false
    if (ident.match(/^\".*?\"$/)) {
      isQuotedIdent = true
      ident = fixQuotedIdent(ident)
    }
    const table = pgInfo.tableColumns.find((tbl: TableColumn) => {
      return (
        (isQuotedIdent && tbl.tablename === ident) ||
        (!isQuotedIdent && tbl.tablename.toLocaleLowerCase() == ident.toLocaleLowerCase())
      )
    })

    if (!table) return { suggestions: items }
    table.columns.forEach((field: TableColumnField | null) => {
      if (!field) return
      items.push({
        label: field.attname,
        kind: monaco.languages.CompletionItemKind.Property,
        detail: field.data_type,
        insertText: field.attname,
        range,
      })
    })
  } else {
    // probably a table - list the tables
    pgInfo.tableColumns.forEach((table: TableColumn) => {
      items.push({
        label: table.tablename,
        kind: monaco.languages.CompletionItemKind.Class,
        insertText: table.tablename,
        range,
      })
    })
  }

  return { suggestions: items }
}

function dotScenarioSuggestions(
  monaco: Monaco,
  pgInfo: PgInfo,
  iterator: BackwardIterator,
  range: languages.CompletionItem['range'],
  statement: string
) {
  const items: languages.CompletionItem[] = []

  const idents = readIdents(iterator, 3)
  let pos = 0

  let schema = pgInfo.schemas.find((sch: Schema) => {
    const _ident = idents.length > pos ? idents[pos] : EMPTY_IDENT
    return (
      (_ident.isQuoted && sch.name === _ident.name) ||
      (!_ident.isQuoted && sch.name.toLocaleLowerCase() == _ident.name.toLocaleLowerCase())
    )
  })

  // A schema can't be part of an alias (`myschema.c.id` isn't valid SQL), so only
  // attempt alias resolution when nothing before this ident was consumed as a schema.
  // This must happen before the `public`-schema fallback/early-return below, so `c.`
  // resolves via the FROM/JOIN alias even in a database with no `public` schema.
  if (!schema) {
    const tableIdent = idents.length > pos ? idents[pos] : EMPTY_IDENT
    const aliasedTables = resolveTablesForIdent(
      pgInfo.tableColumns,
      getFromClauseTables(statement),
      tableIdent
    )
    if (aliasedTables.length > 0) {
      aliasedTables[0].columns.forEach((field: TableColumnField | null) => {
        if (!field) return
        items.push({
          label: field.attname,
          kind: monaco.languages.CompletionItemKind.Property,
          detail: field.data_type,
          insertText: formatInsertText(field.attname),
          range,
        })
      })
      return { suggestions: items }
    }
  } else {
    pos++
  }

  if (!schema) {
    schema = pgInfo.schemas.find((sch: Schema) => sch.name == 'public')
  }

  // No custom schema and no `public` schema either — nothing sensible to suggest.
  if (!schema) return { suggestions: items }

  if (idents.length == pos) {
    pgInfo.tableColumns.forEach((tbl: TableColumn) => {
      if (tbl.schemaname != schema.name) {
        return
      }
      items.push({
        label: tbl.tablename,
        kind: monaco.languages.CompletionItemKind.Class,
        detail: tbl.schemaname !== 'public' ? tbl.schemaname : undefined,
        insertText: formatInsertText(tbl.tablename),
        range,
      })
    })
    return { suggestions: items }
  }

  const tableIdent = idents.length > pos ? idents[pos] : EMPTY_IDENT

  const table = pgInfo.tableColumns.find((tbl: TableColumn) => {
    if (tbl.schemaname !== schema.name) return false
    return tableIdent.isQuoted
      ? tbl.tablename === tableIdent.name
      : tbl.tablename.toLocaleLowerCase() == tableIdent.name.toLocaleLowerCase()
  })

  if (table) {
    table.columns.forEach((field: TableColumnField | null) => {
      if (!field) return
      items.push({
        label: field.attname,
        kind: monaco.languages.CompletionItemKind.Property,
        detail: field.data_type,
        insertText: formatInsertText(field.attname),
        range,
      })
    })
  }

  return { suggestions: items }
}

function defaultScenarioSuggestions(
  monaco: Monaco,
  pgInfo: PgInfo,
  statement: string,
  range: languages.CompletionItem['range']
) {
  const items: languages.CompletionItem[] = []

  pgInfo.keywords.forEach((x: string) => {
    items.push({
      label: x,
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: x,
      range,
    })
  })

  pgInfo.schemas.forEach((x: Schema) => {
    items.push({
      label: x.name,
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: x.name,
      range,
    })
  })

  const allTableColumns = pgInfo.tableColumns

  allTableColumns.forEach((x: TableColumn) => {
    const insertText = x.schemaname == 'public' ? x.tablename : x.schemaname + '.' + x.tablename
    items.push({
      label: x.tablename,
      detail: x.schemaname !== 'public' ? x.schemaname : undefined,
      kind: x.is_table
        ? monaco.languages.CompletionItemKind.Class
        : monaco.languages.CompletionItemKind.Interface,
      insertText: formatInsertText(insertText),
      range,
    })
  })

  // Narrow column suggestions down to the table(s) referenced in the current
  // statement's FROM/JOIN clauses (e.g. `select * from colors where |` should
  // only suggest colors' columns). Falls back to every table's columns when
  // none can be resolved, e.g. before a FROM clause has been typed.
  const fromClauseTables = getFromClauseTables(statement)

  // If the statement ends with `alias.` (Monaco can re-request suggestions this way
  // right after the dot, without going through the dot-trigger scenario), scope
  // strictly to that one alias/table instead of every FROM/JOIN table — otherwise
  // e.g. `c.` after `orders o join customers c` would suggest orders' columns too.
  const trailingDotIdent = parseTrailingDotIdent(statement)
  const aliasScopedTableColumns = trailingDotIdent
    ? resolveTablesForIdent(allTableColumns, fromClauseTables, trailingDotIdent)
    : []

  const inScopeTableColumns =
    aliasScopedTableColumns.length > 0
      ? aliasScopedTableColumns
      : filterTablesByReferences(allTableColumns, fromClauseTables)
  const hasResolvedFromTables = inScopeTableColumns.length > 0
  const relevantTableColumns = hasResolvedFromTables ? inScopeTableColumns : allTableColumns

  // Monaco sorts suggestions by sortText (falling back to label) when nothing has been typed
  // yet, so without this, columns get buried alphabetically amongst keywords/functions. Rank
  // them first once we know which table(s) are in scope; leave sorting untouched otherwise
  // (e.g. before FROM is typed). Columns sharing a name+type across in-scope tables are merged
  // into one suggestion, tracked here rather than on the item itself so the item stays a plain
  // Monaco CompletionItem.
  const columnItemsByKey = new Map<string, { item: languages.CompletionItem; tables: string[] }>()

  relevantTableColumns.forEach((x: TableColumn) => {
    x.columns.forEach((field: TableColumnField | null) => {
      if (!field) return

      const key = `${field.attname}::${field.data_type}`
      const existing = columnItemsByKey.get(key)
      if (existing) {
        existing.tables.push(x.tablename)
        existing.tables.sort()
        existing.item.documentation = existing.tables.join(', ')
      } else {
        const item: languages.CompletionItem = {
          label: field.attname,
          kind: monaco.languages.CompletionItemKind.Field,
          detail: field.data_type,
          documentation: x.tablename,
          insertText: formatInsertText(field.attname),
          range,
          sortText: hasResolvedFromTables ? `0_${field.attname}` : undefined,
        }
        columnItemsByKey.set(key, { item, tables: [x.tablename] })
        items.push(item)
      }
    })
  })

  pgInfo.functions.forEach((x: SavedDatabaseFunction) => {
    items.push({
      label: x.name,
      kind: monaco.languages.CompletionItemKind.Function,
      detail: x.return_type,
      insertText: x.name,
      range,
    })
  })

  return { suggestions: items }
}

function fixQuotedIdent(str: string) {
  return str.replace(/^\"/, '').replace(/\"$/, '').replace(/\"\"/, '"')
}

function readIdents(iterator: BackwardIterator, maxlvl: number): QuotableIdent[] {
  return iterator.readIdents(maxlvl).map((name: string) => {
    let isQuoted = false
    if (name.match(/^\".*?\"$/)) {
      isQuoted = true
      name = fixQuotedIdent(name)
    }
    return { isQuoted, name }
  })
}

function formatInsertText(value: string) {
  const hasUpperCase = !(value == value.toLowerCase())
  return hasUpperCase ? `"${value}"` : value
}
