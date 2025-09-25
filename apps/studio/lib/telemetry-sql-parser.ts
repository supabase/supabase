export interface TableCreatedDetection {
  type: 'table_created'
  schema: string
  tableName: string
}

export interface DataInsertedDetection {
  type: 'data_inserted'
  schema: string
  tableName: string
  estimatedRowCount: number
}

export interface RlsEnabledDetection {
  type: 'rls_enabled'
  schema: string
  tableName: string
}

export type ActivationDetection =
  | TableCreatedDetection
  | DataInsertedDetection
  | RlsEnabledDetection

export interface ActivationDetectionResult {
  detections: ActivationDetection[]
}

const stripComments = (sql: string): string => {
  return sql
    .replace(/--[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
}

const extractSchemaAndTable = (
  identifier: string
): { schema: string; tableName: string } => {
  const parts = identifier.trim().split('.')
  if (parts.length === 2) {
    return {
      schema: parts[0].replace(/["`]/g, ''),
      tableName: parts[1].replace(/["`]/g, ''),
    }
  }
  return {
    schema: 'public',
    tableName: identifier.replace(/["`]/g, ''),
  }
}

const detectCreateTable = (sql: string): TableCreatedDetection | null => {
  const createTableRegex =
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?)/i
  const match = sql.match(createTableRegex)

  if (match && match[1]) {
    const { schema, tableName } = extractSchemaAndTable(match[1])
    return {
      type: 'table_created',
      schema,
      tableName,
    }
  }

  return null
}

const detectInsert = (sql: string): DataInsertedDetection | null => {
  const insertRegex =
    /INSERT\s+INTO\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?)/i
  const match = sql.match(insertRegex)

  if (match && match[1]) {
    const { schema, tableName } = extractSchemaAndTable(match[1])

    const commasBetweenParens = sql.match(/\)\s*,\s*\(/g)
    const estimatedRowCount = commasBetweenParens ? commasBetweenParens.length + 1 : 1

    return {
      type: 'data_inserted',
      schema,
      tableName,
      estimatedRowCount,
    }
  }

  return null
}

const detectRlsEnabled = (sql: string): RlsEnabledDetection | null => {
  const rlsRegex =
    /ALTER\s+TABLE\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?)\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i
  const match = sql.match(rlsRegex)

  if (match && match[1]) {
    const { schema, tableName } = extractSchemaAndTable(match[1])
    return {
      type: 'rls_enabled',
      schema,
      tableName,
    }
  }

  return null
}

export const getSqlToAnalyze = (fullSql: string, selection?: string): string => {
  if (selection && selection.trim().length > 0) {
    return selection.trim()
  }
  return fullSql.trim()
}

export const detectActivationFromSql = (sql: string): ActivationDetectionResult => {
  const cleanedSql = stripComments(sql)
  const statements = cleanedSql.split(';').filter((s) => s.trim().length > 0)

  const detections: ActivationDetection[] = []

  for (const statement of statements) {
    const trimmedStatement = statement.trim()
    if (!trimmedStatement) continue

    const tableCreated = detectCreateTable(trimmedStatement)
    if (tableCreated) {
      detections.push(tableCreated)
      continue
    }

    const dataInserted = detectInsert(trimmedStatement)
    if (dataInserted) {
      detections.push(dataInserted)
      continue
    }

    const rlsEnabled = detectRlsEnabled(trimmedStatement)
    if (rlsEnabled) {
      detections.push(rlsEnabled)
      continue
    }
  }

  return { detections }
}