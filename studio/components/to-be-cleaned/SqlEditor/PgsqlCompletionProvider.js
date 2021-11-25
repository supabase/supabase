import BackwardIterator from './BackwardIterator'

export default function getPgsqlCompletionProvider(monaco, sqlEditorStore) {
  return {
    triggerCharacters: [' ', '.', '"'],
    provideCompletionItems: function (model, position, context) {
      try {
        // position.column should minus 2 as it returns 2 for first char
        // position.lineNumber should minus 1
        let iterator = new BackwardIterator(model, position.column - 2, position.lineNumber - 1)

        if (context.triggerCharacter === '"') {
          return startingQuoteScenarioSuggestions(monaco, sqlEditorStore, iterator)
        } else if (context.triggerCharacter === '.') {
          return dotScenarioSuggestions(monaco, sqlEditorStore, iterator)
        } else {
          return defaultScenarioSuggestions(monaco, sqlEditorStore)
        }
      } catch (_) {
        // any error, returns empty suggestion
        return { suggestions: [] }
      }
    },
  }
}

function startingQuoteScenarioSuggestions(monaco, sqlEditorStore, iterator) {
  const items = []

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
    let table = sqlEditorStore.tableCache.find((tbl) => {
      return (
        (isQuotedIdent && tbl.tablename === ident) ||
        (!isQuotedIdent && tbl.tablename.toLocaleLowerCase() == ident.toLocaleLowerCase())
      )
    })

    if (!table) return { suggestions: items }
    table.columns.forEach((field) => {
      items.push({
        label: field.attname,
        kind: monaco.languages.CompletionItemKind.Property,
        detail: field.data_type,
        insertText: field.attname,
      })
    })
  } else {
    // probably a table - list the tables
    sqlEditorStore.tableCache.forEach((table) => {
      items.push({
        label: table.tablename,
        kind: monaco.languages.CompletionItemKind.Class,
        insertText: table.tablename,
      })
    })
  }

  return { suggestions: items }
}

function dotScenarioSuggestions(monaco, sqlEditorStore, iterator) {
  const items = []

  let idents = readIdents(iterator, 3)
  let pos = 0

  let schema = sqlEditorStore.schemaCache.find((sch) => {
    const _ident = idents && idents.length > pos ? idents[pos] : {}
    return (
      (_ident.isQuoted && sch.name === _ident.name) ||
      (!_ident.isQuoted && sch.name?.toLocaleLowerCase() == _ident.name?.toLocaleLowerCase())
    )
  })

  if (!schema) {
    schema = sqlEditorStore.schemaCache.find((sch) => {
      return sch.name == 'public'
    })
  } else {
    pos++
  }

  if (idents.length == pos) {
    sqlEditorStore.tableCache.forEach((tbl) => {
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

  let table = sqlEditorStore.tableCache.find((tbl) => {
    const _ident = idents && idents.length > pos ? idents[pos] : {}
    return (
      (tbl.schemaname == schema.name && _ident.isQuoted && tbl.tablename === _ident.name) ||
      (!_ident.isQuoted && tbl.tablename?.toLocaleLowerCase() == _ident.name?.toLocaleLowerCase())
    )
  })

  if (table) {
    table.columns.forEach((field) => {
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

function defaultScenarioSuggestions(monaco, sqlEditorStore) {
  const items = []

  if (sqlEditorStore.keywordCache?.length > 0) {
    sqlEditorStore.keywordCache.forEach((x) => {
      items.push({
        label: x,
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: x,
      })
    })
  }

  if (sqlEditorStore.schemaCache?.length > 0) {
    sqlEditorStore.schemaCache.forEach((x) => {
      items.push({
        label: x.name,
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: x.name,
      })
    })
  }

  if (sqlEditorStore.tableCache?.length > 0) {
    sqlEditorStore.tableCache.forEach((x) => {
      const insertText = x.schemaname == 'public' ? x.tablename : x.schemaname + '.' + x.tablename
      items.push({
        label: x.tablename,
        detail: x.schemaname !== 'public' ? x.schemaname : null,
        kind: x.is_table
          ? monaco.languages.CompletionItemKind.Class
          : monaco.languages.CompletionItemKind.Interface,
        insertText: formatInsertText(insertText),
      })
      x.columns.forEach((field) => {
        if (!field) return

        let foundItem = items.find(
          (i) =>
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

  if (sqlEditorStore.functionCache?.length > 0) {
    sqlEditorStore.functionCache.forEach((x) => {
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

function fixQuotedIdent(str) {
  return str.replace(/^\"/, '').replace(/\"$/, '').replace(/\"\"/, '"')
}

function readIdents(iterator, maxlvl) {
  return iterator.readIdents(maxlvl).map((name) => {
    let isQuoted = false
    if (name.match(/^\".*?\"$/)) {
      isQuoted = true
      name = fixQuotedIdent(name)
    }
    return { isQuoted: isQuoted, name: name }
  })
}

function formatInsertText(value) {
  const hasUpperCase = !(value == value.toLowerCase())
  return hasUpperCase ? `"${value}"` : value
}
