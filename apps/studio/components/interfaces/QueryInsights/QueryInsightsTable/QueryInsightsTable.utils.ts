import { formatDuration as formatDurationLong } from '../../QueryPerformance/QueryPerformance.utils'

export const formatDuration = (ms: number) => {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`
  }
  return formatDurationLong(ms)
}

export const getQueryType = (query: string | undefined | null): string | null => {
  if (!query) return null
  const trimmed = query.trim()
  const firstWord = trimmed.split(/\s+/)[0]?.toUpperCase()

  const sqlTypes = [
    'SELECT',
    'INSERT',
    'UPDATE',
    'DELETE',
    'CREATE',
    'DROP',
    'ALTER',
    'TRUNCATE',
    'WITH',
  ]

  if (firstWord && sqlTypes.includes(firstWord)) {
    return firstWord
  }

  if (trimmed.toUpperCase().startsWith('WITH')) {
    const match = trimmed.match(/WITH\s+.*?\s+(SELECT|INSERT|UPDATE|DELETE)/i)
    if (match && match[1]) {
      return match[1].toUpperCase()
    }
    return 'WITH'
  }

  return null
}

const cleanIdentifier = (identifier?: string): string | null => {
  if (!identifier) return null
  return (
    identifier
      .replace(/["`']/g, '')
      .replace(/^[\w]+\./, '')
      .trim() || null
  )
}

export const getTableName = (query: string | undefined | null): string | null => {
  if (!query) return null
  const trimmed = query.trim()

  let match = trimmed.match(
    /FROM\s+(?:(?<schema>(?:"[^"]+"|[\w]+)\.)?(?<table>(?:"[^"]+"|[\w]+)))/i
  )
  if (match?.groups?.table) {
    return cleanIdentifier(match.groups.table)
  }

  match = trimmed.match(
    /INSERT\s+INTO\s+(?:(?<schema>(?:"[^"]+"|[\w]+)\.)?(?<table>(?:"[^"]+"|[\w]+)))/i
  )
  if (match?.groups?.table) {
    return cleanIdentifier(match.groups.table)
  }

  match = trimmed.match(/UPDATE\s+(?:(?<schema>(?:"[^"]+"|[\w]+)\.)?(?<table>(?:"[^"]+"|[\w]+)))/i)
  if (match?.groups?.table) {
    return cleanIdentifier(match.groups.table)
  }

  match = trimmed.match(
    /DELETE\s+FROM\s+(?:(?<schema>(?:"[^"]+"|[\w]+)\.)?(?<table>(?:"[^"]+"|[\w]+)))/i
  )
  if (match?.groups?.table) {
    return cleanIdentifier(match.groups.table)
  }

  match = trimmed.match(
    /CREATE\s+(?:TEMPORARY\s+|TEMP\s+|UNLOGGED\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:(?<schema>(?:"[^"]+"|[\w]+)\.)?(?<table>(?:"[^"]+"|[\w]+)))/i
  )
  if (match?.groups?.table) {
    return cleanIdentifier(match.groups.table)
  }

  match = trimmed.match(
    /ALTER\s+TABLE\s+(?:(?<schema>(?:"[^"]+"|[\w]+)\.)?(?<table>(?:"[^"]+"|[\w]+)))/i
  )
  if (match?.groups?.table) {
    return cleanIdentifier(match.groups.table)
  }

  match = trimmed.match(
    /DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:(?<schema>(?:"[^"]+"|[\w]+)\.)?(?<table>(?:"[^"]+"|[\w]+)))/i
  )
  if (match?.groups?.table) {
    return cleanIdentifier(match.groups.table)
  }

  match = trimmed.match(
    /TRUNCATE\s+(?:TABLE\s+)?(?:(?<schema>(?:"[^"]+"|[\w]+)\.)?(?<table>(?:"[^"]+"|[\w]+)))/i
  )
  if (match?.groups?.table) {
    return cleanIdentifier(match.groups.table)
  }

  if (trimmed.toUpperCase().startsWith('WITH')) {
    match = trimmed.match(
      /WITH\s+[\s\S]*?\s+FROM\s+(?:(?<schema>(?:"[^"]+"|[\w]+)\.)?(?<table>(?:"[^"]+"|[\w]+)))/i
    )
    if (match?.groups?.table) {
      return cleanIdentifier(match.groups.table)
    }
  }

  return null
}

export const getColumnName = (query: string | undefined | null): string | null => {
  if (!query) return null
  const trimmed = query.trim()

  let match = trimmed.match(
    /WHERE\s+(?:(?<table>(?:"[^"]+"|[\w]+)\.)?(?<column>(?:"[^"]+"|[\w]+)))/i
  )
  if (match?.groups?.column) {
    return cleanIdentifier(match?.groups?.column)
  }

  match = trimmed.match(
    /SELECT\s+(?:\*\s+FROM|(?:(?<table>(?:"[^"]+"|[\w]+)\.)?(?<column>(?:"[^"]+"|[\w]+))(?:\s*,\s*[\w.]+)*)\s+FROM)/i
  )
  if (match?.groups?.column && match.groups.column.toUpperCase() !== '*') {
    return cleanIdentifier(match.groups.column)
  }

  match = trimmed.match(
    /ORDER\s+BY\s+(?:(?<table>(?:"[^"]+"|[\w]+)\.)?(?<column>(?:"[^"]+"|[\w]+)))/i
  )
  if (match?.groups?.column) {
    return cleanIdentifier(match.groups.column)
  }

  match = trimmed.match(
    /GROUP\s+BY\s+(?:(?<table>(?:"[^"]+"|[\w]+)\.)?(?<column>(?:"[^"]+"|[\w]+)))/i
  )
  if (match?.groups?.column) {
    return cleanIdentifier(match.groups.column)
  }

  match = trimmed.match(
    /UPDATE\s+[\w.]+\s+SET\s+(?:(?<table>(?:"[^"]+"|[\w]+)\.)?(?<column>(?:"[^"]+"|[\w]+)))/i
  )
  if (match?.groups?.column) {
    return cleanIdentifier(match.groups.column)
  }

  match = trimmed.match(/INSERT\s+INTO\s+[\w.]+\s*\((?<column>(?:"[^"]+"|[\w]+))/i)
  if (match?.groups?.column) {
    return cleanIdentifier(match.groups.column)
  }

  return null
}

export const formatQueryDisplay = (
  queryType: string | null,
  tableName: string | null,
  columnName: string | null
): string => {
  const type = queryType ?? '–'
  const table = tableName ?? '–'
  const column = columnName ?? '–'
  return `${type} in ${table}, ${column}`
}
