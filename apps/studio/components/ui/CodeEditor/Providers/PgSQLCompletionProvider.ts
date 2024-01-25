import { RefObject } from 'react'
import BackwardIterator from './BackwardIterator'
import { Schema } from 'data/database/schemas-query'
import { TableColumn } from 'data/database/table-columns-query'
import { DatabaseFunction } from 'data/database/functions-query'

// [Joshen] Needs to be fixed

export default function getPgsqlCompletionProvider(monaco: any, pgInfoRef: RefObject<any>) {
  return {
    triggerCharacters: [' ', '.', '"'],
    provideCompletionItems: function (model: any, position: any, context: any) {
      try {
        // position.column should minus 2 as it returns 2 for first char
        // position.lineNumber should minus 1
        let iterator = new BackwardIterator(model, position.column - 2, position.lineNumber - 1)

        if (context.triggerCharacter === '"') {
          return startingQuoteScenarioSuggestions(monaco, pgInfoRef, iterator)
        } else if (context.triggerCharacter === '.') {
          return dotScenarioSuggestions(monaco, pgInfoRef, iterator)
        } else {
          return defaultScenarioSuggestions(monaco, pgInfoRef)
        }
      } catch (_) {
        // any error, returns empty suggestion
        return { suggestions: [] }
      }
    },
  }
}

function startingQuoteScenarioSuggestions(monaco: any, pgInfoRef: RefObject<any>, iterator: any) {
  const items: any[] = []

  let startingQuotedIdent = iterator.isFowardDQuote()
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
    let table = pgInfoRef.current.tableColumns.find((tbl: TableColumn) => {
      return (
        (isQuotedIdent && tbl.tablename === ident) ||
        (!isQuotedIdent && tbl.tablename.toLocaleLowerCase() == ident.toLocaleLowerCase())
      )
    })

    if (!table) return { suggestions: items }
    table.columns.forEach((field: any) => {
      items.push({
        label: field.attname,
        kind: monaco.languages.CompletionItemKind.Property,
        detail: field.data_type,
        insertText: field.attname,
      })
    })
  } else {
    // probably a table - list the tables
    pgInfoRef.current.tableColumns.forEach((table: TableColumn) => {
      items.push({
        label: table.tablename,
        kind: monaco.languages.CompletionItemKind.Class,
        insertText: table.tablename,
      })
    })
  }

  return { suggestions: items }
}

function dotScenarioSuggestions(monaco: any, pgInfoRef: RefObject<any>, iterator: any) {
  const items: any[] = []

  let idents = readIdents(iterator, 3)
  let pos = 0

  let schema = pgInfoRef.current.schemas.find((sch: Schema) => {
    const _ident = idents && idents.length > pos ? idents[pos] : {}
    return (
      (_ident.isQuoted && sch.name === _ident.name) ||
      (!_ident.isQuoted && sch.name?.toLocaleLowerCase() == _ident.name?.toLocaleLowerCase())
    )
  })

  if (!schema) {
    schema = pgInfoRef.current.schemas.find((sch: Schema) => {
      return sch.name == 'public'
    })
  } else {
    pos++
  }

  if (idents.length == pos) {
    pgInfoRef.current.tableColumns.forEach((tbl: TableColumn) => {
      if (tbl.schemaname != schema.name) {
        return
      }
      items.push({
        label: tbl.tablename,
        kind: monaco.languages.CompletionItemKind.Class,
        detail: tbl.schemaname !== 'public' ? tbl.schemaname : null,
        insertText: formatInsertText(tbl.tablename),
      })
    })
    return { suggestions: items }
  }

  let table = pgInfoRef.current.tableColumns.find((tbl: TableColumn) => {
    const _ident = idents && idents.length > pos ? idents[pos] : {}
    return (
      (tbl.schemaname == schema.name && _ident.isQuoted && tbl.tablename === _ident.name) ||
      (!_ident.isQuoted && tbl.tablename?.toLocaleLowerCase() == _ident.name?.toLocaleLowerCase())
    )
  })

  if (table) {
    table.columns.forEach((field: any) => {
      items.push({
        label: field.attname,
        kind: monaco.languages.CompletionItemKind.Property,
        detail: field.data_type,
        insertText: formatInsertText(field.attname),
      })
    })
  }

  return { suggestions: items }
}

function defaultScenarioSuggestions(monaco: any, pgInfoRef: RefObject<any>) {
  const items: any = []

  if (pgInfoRef.current.keywords?.length > 0) {
    pgInfoRef.current.keywords.forEach((x: string) => {
      items.push({
        label: x,
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: x,
      })
    })
  }

  if (pgInfoRef.current.schemas?.length > 0) {
    pgInfoRef.current.schemas.forEach((x: Schema) => {
      items.push({
        label: x.name,
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: x.name,
      })
    })
  }

  if (pgInfoRef.current.tableColumns?.length > 0) {
    pgInfoRef.current.tableColumns.forEach((x: TableColumn) => {
      const insertText = x.schemaname == 'public' ? x.tablename : x.schemaname + '.' + x.tablename
      items.push({
        label: x.tablename,
        detail: x.schemaname !== 'public' ? x.schemaname : null,
        kind: x.is_table
          ? monaco.languages.CompletionItemKind.Class
          : monaco.languages.CompletionItemKind.Interface,
        insertText: formatInsertText(insertText),
      })
      x.columns.forEach((field: any) => {
        if (!field) return

        let foundItem = items.find(
          (i: any) =>
            i.label === field?.attname &&
            i.kind === monaco.languages.CompletionItemKind.Field &&
            i.detail === field?.data_type
        )
        if (foundItem) {
          foundItem.tables.push(x.tablename)
          foundItem.tables.sort()
          foundItem.documentation = foundItem.tables.join(', ')
        } else {
          items.push({
            label: field.attname,
            kind: monaco.languages.CompletionItemKind.Field,
            detail: field.data_type,
            documentation: x.tablename,
            tables: [x.tablename],
            insertText: formatInsertText(field.attname),
          })
        }
      })
    })
  }

  if (pgInfoRef.current.functions?.length > 0) {
    pgInfoRef.current.functions.forEach((x: DatabaseFunction) => {
      items.push({
        label: x.name,
        kind: monaco.languages.CompletionItemKind.Function,
        detail: x.result_type,
        documentation: x.description,
        insertText: x.name,
      })
    })
  }

  return { suggestions: items }
}

function fixQuotedIdent(str: string) {
  return str.replace(/^\"/, '').replace(/\"$/, '').replace(/\"\"/, '"')
}

function readIdents(iterator: any, maxlvl: number) {
  return iterator.readIdents(maxlvl).map((name: string) => {
    let isQuoted = false
    if (name.match(/^\".*?\"$/)) {
      isQuoted = true
      name = fixQuotedIdent(name)
    }
    return { isQuoted: isQuoted, name: name }
  })
}

function formatInsertText(value: string) {
  const hasUpperCase = !(value == value.toLowerCase())
  return hasUpperCase ? `"${value}"` : value
}
