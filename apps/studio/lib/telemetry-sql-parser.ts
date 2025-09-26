import { PgParser } from '@supabase/pg-parser'
import { removeCommentsFromSql } from 'lib/helpers'

// Constants
const DEFAULT_SCHEMA = 'public'
const MAX_SQL_LENGTH = 10_485_760 // 10 MB

// Type definitions for detection results
export interface TableCreatedDetection {
  type: 'table_created'
  schema: string
  tableName: string
}

export interface DataInsertedDetection {
  type: 'data_inserted'
  schema: string
  tableName: string
  estimatedRowCount: number | undefined
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

// Type definitions for PostgreSQL AST nodes
interface RangeVar {
  schemaname?: string
  relname: string
}

interface CreateStmt {
  CreateStmt: {
    relation: RangeVar
    tableElts?: unknown[]
    oncommit?: string
    tablespacename?: string
    if_not_exists?: boolean
  }
}

interface CreateTableAsStmt {
  CreateTableAsStmt: {
    into?: {
      rel: RangeVar
      skipData?: boolean
    }
    query?: unknown
    objtype?: string
    is_select_into?: boolean
  }
}

interface InsertStmt {
  InsertStmt: {
    relation: RangeVar
    cols?: unknown[]
    selectStmt?: {
      SelectStmt?: {
        valuesLists?: unknown[][]
      }
    }
    returningList?: unknown[]
    withClause?: unknown
    onConflictClause?: unknown
    override?: string
  }
}

interface AlterTableStmt {
  AlterTableStmt: {
    relation: RangeVar
    cmds: AlterTableCmd[]
    relkind?: string
    missing_ok?: boolean
  }
}

interface AlterTableCmd {
  AlterTableCmd: {
    subtype: string // Changed from number to string
    name?: string
    newowner?: unknown
    def?: unknown
    behavior?: string
    missing_ok?: boolean
  }
}

type ParsedStatement = CreateStmt | CreateTableAsStmt | InsertStmt | AlterTableStmt | { [key: string]: unknown }

// Helper function to extract schema and table name from RangeVar
const extractSchemaAndTable = (rangeVar: RangeVar): { schema: string; tableName: string } => {
  const schema = rangeVar.schemaname || DEFAULT_SCHEMA
  const tableName = rangeVar.relname

  // Remove quotes from identifiers if present
  const cleanSchema = schema.replace(/^"|"$/g, '')
  const cleanTableName = tableName.replace(/^"|"$/g, '')

  return {
    schema: cleanSchema,
    tableName: cleanTableName,
  }
}

// Detect CREATE TABLE statements
const detectCreateTable = (stmt: ParsedStatement): TableCreatedDetection | null => {
  if ('CreateStmt' in stmt) {
    const createStmt = stmt as CreateStmt
    const { schema, tableName } = extractSchemaAndTable(createStmt.CreateStmt.relation)

    return {
      type: 'table_created',
      schema,
      tableName,
    }
  }

  // Handle CREATE TABLE AS SELECT
  if ('CreateTableAsStmt' in stmt) {
    const createTableAsStmt = stmt as CreateTableAsStmt
    // The table info is usually in the 'into' field
    if (createTableAsStmt.CreateTableAsStmt.into?.rel) {
      const { schema, tableName } = extractSchemaAndTable(createTableAsStmt.CreateTableAsStmt.into.rel)
      return {
        type: 'table_created',
        schema,
        tableName,
      }
    }
  }

  return null
}

// Count rows in INSERT VALUES statement
const countInsertRows = (selectStmt: unknown): number | undefined => {
  if (!selectStmt || typeof selectStmt !== 'object') {
    return undefined
  }

  const stmt = selectStmt as { SelectStmt?: { valuesLists?: unknown[][] } }

  if (stmt.SelectStmt?.valuesLists && Array.isArray(stmt.SelectStmt.valuesLists)) {
    return stmt.SelectStmt.valuesLists.length
  }

  // For INSERT ... SELECT, we can't determine the row count
  return undefined
}

// Detect INSERT statements
const detectInsert = (stmt: ParsedStatement): DataInsertedDetection | null => {
  if ('InsertStmt' in stmt) {
    const insertStmt = stmt as InsertStmt
    const { schema, tableName } = extractSchemaAndTable(insertStmt.InsertStmt.relation)

    // Try to estimate row count
    const estimatedRowCount = insertStmt.InsertStmt.selectStmt
      ? countInsertRows(insertStmt.InsertStmt.selectStmt)
      : 1 // Default VALUES or DEFAULT VALUES

    return {
      type: 'data_inserted',
      schema,
      tableName,
      estimatedRowCount,
    }
  }

  return null
}

// Detect ALTER TABLE ... ENABLE ROW LEVEL SECURITY
const detectRlsEnabled = (stmt: ParsedStatement): RlsEnabledDetection | null => {
  if ('AlterTableStmt' in stmt) {
    const alterStmt = stmt as AlterTableStmt

    // Check if any command is enabling RLS
    const hasEnableRls = alterStmt.AlterTableStmt.cmds.some(
      cmd => cmd.AlterTableCmd.subtype === 'AT_EnableRowSecurity'
    )

    if (hasEnableRls) {
      const { schema, tableName } = extractSchemaAndTable(alterStmt.AlterTableStmt.relation)

      return {
        type: 'rls_enabled',
        schema,
        tableName,
      }
    }
  }

  return null
}

// Create a parser instance
const parser = new PgParser()

// Parse a single SQL statement and detect activations
const parseStatement = async (sql: string): Promise<ActivationDetection[]> => {
  try {
    const parseResult = await parser.parse(sql)

    if (parseResult.error || !parseResult.tree) {
      return []
    }

    const detections: ActivationDetection[] = []

    // The tree structure has stmts array
    if (!parseResult.tree.stmts) {
      return []
    }

    for (const stmtWrapper of parseResult.tree.stmts) {
      // Each statement is wrapped in a stmt object
      const stmt = stmtWrapper.stmt
      if (!stmt) continue

      // Try each detector
      const tableCreated = detectCreateTable(stmt as ParsedStatement)
      if (tableCreated) {
        detections.push(tableCreated)
        continue
      }

      const dataInserted = detectInsert(stmt as ParsedStatement)
      if (dataInserted) {
        detections.push(dataInserted)
        continue
      }

      const rlsEnabled = detectRlsEnabled(stmt as ParsedStatement)
      if (rlsEnabled) {
        detections.push(rlsEnabled)
      }
    }

    return detections
  } catch (error) {
    // Return empty array on parse errors
    return []
  }
}

// Get the SQL to analyze (either selection or full SQL)
export const getSqlToAnalyze = (fullSql: string, selection?: string): string => {
  if (selection && selection.trim().length > 0) {
    return selection.trim()
  }
  return fullSql.trim()
}

// Main function to detect activation events from SQL
export const detectActivationFromSql = async (sql: string): Promise<ActivationDetectionResult> => {
  // Input validation
  if (!sql || typeof sql !== 'string') {
    return { detections: [] }
  }

  // Check SQL length
  if (sql.length > MAX_SQL_LENGTH) {
    return { detections: [] }
  }

  // Remove comments
  const cleanedSql = removeCommentsFromSql(sql)

  // Split by semicolons, but be careful with semicolons in strings
  // The parser should handle this properly, but we'll split conservatively
  const statements = splitSqlStatements(cleanedSql)

  const detections: ActivationDetection[] = []

  for (const statement of statements) {
    const trimmedStatement = statement.trim()
    if (!trimmedStatement) continue

    const stmtDetections = await parseStatement(trimmedStatement)
    detections.push(...stmtDetections)
  }

  return { detections }
}

// Split SQL into individual statements, respecting string literals
const splitSqlStatements = (sql: string): string[] => {
  const statements: string[] = []
  let currentStatement = ''
  let inSingleQuote = false
  let inDoubleQuote = false
  let inDollarQuote = false
  let dollarQuoteTag = ''

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i]
    const nextChar = sql[i + 1]

    // Handle escape sequences
    if (char === '\\' && (inSingleQuote || inDoubleQuote)) {
      currentStatement += char
      if (nextChar) {
        currentStatement += nextChar
        i++
      }
      continue
    }

    // Handle dollar quotes
    if (char === '$' && !inSingleQuote && !inDoubleQuote) {
      const dollarMatch = sql.slice(i).match(/^\$([^$]*)\$/)
      if (dollarMatch) {
        if (inDollarQuote && dollarQuoteTag === dollarMatch[1]) {
          // End of dollar quote
          inDollarQuote = false
          dollarQuoteTag = ''
        } else if (!inDollarQuote) {
          // Start of dollar quote
          inDollarQuote = true
          dollarQuoteTag = dollarMatch[1]
        }
        currentStatement += dollarMatch[0]
        i += dollarMatch[0].length - 1
        continue
      }
    }

    // Handle regular quotes
    if (!inDollarQuote) {
      if (char === "'" && !inDoubleQuote) {
        // Check for escaped single quote
        if (nextChar === "'") {
          currentStatement += "''"
          i++
          continue
        }
        inSingleQuote = !inSingleQuote
      } else if (char === '"' && !inSingleQuote) {
        inDoubleQuote = !inDoubleQuote
      }
    }

    // Handle semicolons outside of quotes
    if (char === ';' && !inSingleQuote && !inDoubleQuote && !inDollarQuote) {
      if (currentStatement.trim()) {
        statements.push(currentStatement.trim())
      }
      currentStatement = ''
      continue
    }

    currentStatement += char
  }

  // Add the last statement if any
  if (currentStatement.trim()) {
    statements.push(currentStatement.trim())
  }

  return statements
}