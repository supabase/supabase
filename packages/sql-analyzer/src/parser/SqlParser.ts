import { ParsedQuery, QueryComplexity } from '../types/QueryTypes'

/**
 * Core SQL parser for analyzing PostgreSQL queries
 */
export class SqlParser {
  private sql: string
  private tokens: string[] = []
  private normalizedSql: string = ''

  constructor(sql: string) {
    this.sql = sql.trim()
    this.normalize()
    this.tokenize()
  }

  /**
   * Parse the SQL and return a structured representation
   */
  public parse(): ParsedQuery {
    const operation = this.extractOperation()
    const tables = this.extractTables()
    const columns = this.extractColumns()
    const functions = this.extractFunctions()
    const schemas = this.extractSchemas()

    const analysis = this.analyzeQuery()

    return {
      originalSql: this.sql,
      normalizedSql: this.normalizedSql,
      operation,
      tables,
      columns,
      functions,
      schemas,
      hasSubqueries: analysis.hasSubqueries,
      hasCTEs: analysis.hasCTEs,
      hasWindowFunctions: analysis.hasWindowFunctions,
      isModifying: analysis.isModifying,
      isReadOnly: analysis.isReadOnly,
    }
  }

  /**
   * Tokenize the SQL string into individual tokens
   */
  private tokenize(): void {
    // Tokenize the normalized SQL (which has comments removed)
    const tokenRegex = /(\w+|[^\w\s]|\s+)/g
    const matches = this.normalizedSql.match(tokenRegex) || []

    this.tokens = matches
      .map((token) => token.trim())
      .filter((token) => token.length > 0 && token !== ' ')
  }

  /**
   * Normalize the SQL by removing extra whitespace and standardizing case
   */
  private normalize(): void {
    this.normalizedSql = this.removeComments(this.sql)
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\s*([(),;])\s*/g, '$1') // Remove spaces around punctuation
      .trim()
  }

  /**
   * Extract the main operation from the SQL
   */
  private extractOperation(): string {
    if (this.tokens.length === 0) return 'UNKNOWN'

    const firstToken = this.tokens[0]
    const firstTokenUpper = firstToken.toUpperCase()

    // Handle multi-word operations
    if (firstTokenUpper === 'CREATE' && this.tokens.length > 1) {
      const secondToken = this.tokens[1]
      return `${firstToken} ${secondToken}`
    }

    if (firstTokenUpper === 'ALTER' && this.tokens.length > 1) {
      const secondToken = this.tokens[1]
      return `${firstToken} ${secondToken}`
    }

    if (firstTokenUpper === 'DROP' && this.tokens.length > 1) {
      const secondToken = this.tokens[1]
      return `${firstToken} ${secondToken}`
    }

    return firstToken
  }

  /**
   * Extract table names referenced in the query
   */
  private extractTables(): string[] {
    const tables = new Set<string>()
    const sql = this.normalizedSql.toUpperCase()

    // FROM clause tables - handle both quoted and unquoted identifiers
    const fromPattern =
      /\bFROM\s+((?:"[^"]+"|'[^']+'|`[^`]+`|[^\s,()]+)(?:\.(?:"[^"]+"|'[^']+'|`[^`]+`|[^\s,()]+))?)/gi
    const originalFromMatches = this.sql.match(fromPattern)
    if (originalFromMatches) {
      originalFromMatches.forEach((match) => {
        const tableName = match.replace(/^FROM\s+/i, '').trim()
        const cleaned = this.cleanIdentifier(tableName)
        tables.add(cleaned)
      })
    }

    // Also check normalized SQL for any missed tables
    const fromMatches = sql.match(/\bFROM\s+([^\s,()]+(?:\.[^\s,()]+)?)/gi)
    if (fromMatches) {
      fromMatches.forEach((match) => {
        const tableName = match.replace(/^FROM\s+/i, '').trim()
        const cleaned = this.cleanIdentifier(tableName.toLowerCase())
        tables.add(cleaned)
      })
    }

    // JOIN clause tables
    const joinMatches = sql.match(
      /\b(?:INNER\s+|LEFT\s+|RIGHT\s+|FULL\s+)?JOIN\s+([^\s,()]+(?:\.[^\s,()]+)?)/gi
    )
    if (joinMatches) {
      joinMatches.forEach((match) => {
        const tableName = match.replace(/.*JOIN\s+/i, '').trim()
        tables.add(this.cleanIdentifier(tableName.toLowerCase()))
      })
    }

    // INSERT INTO tables
    const insertMatches = sql.match(/\bINSERT\s+INTO\s+([^\s,()]+(?:\.[^\s,()]+)?)/gi)
    if (insertMatches) {
      insertMatches.forEach((match) => {
        const tableName = match.replace(/^INSERT\s+INTO\s+/i, '').trim()
        tables.add(this.cleanIdentifier(tableName.toLowerCase()))
      })
    }

    // UPDATE tables
    const updateMatches = sql.match(/\bUPDATE\s+([^\s,()]+(?:\.[^\s,()]+)?)/gi)
    if (updateMatches) {
      updateMatches.forEach((match) => {
        const tableName = match.replace(/^UPDATE\s+/i, '').trim()
        tables.add(this.cleanIdentifier(tableName.toLowerCase()))
      })
    }

    // ALTER TABLE tables
    const alterMatches = sql.match(/\bALTER\s+TABLE\s+([^\s,()]+(?:\.[^\s,()]+)?)/gi)
    if (alterMatches) {
      alterMatches.forEach((match) => {
        const tableName = match.replace(/^ALTER\s+TABLE\s+/i, '').trim()
        tables.add(this.cleanIdentifier(tableName.toLowerCase()))
      })
    }

    // DELETE FROM tables
    const deleteMatches = sql.match(/\bDELETE\s+FROM\s+([^\s,()]+(?:\.[^\s,()]+)?)/gi)
    if (deleteMatches) {
      deleteMatches.forEach((match) => {
        const tableName = match.replace(/^DELETE\s+FROM\s+/i, '').trim()
        tables.add(this.cleanIdentifier(tableName.toLowerCase()))
      })
    }

    return Array.from(tables)
  }

  /**
   * Extract column names referenced in the query
   */
  private extractColumns(): string[] {
    const columns = new Set<string>()
    const sql = this.normalizedSql

    // This is a simplified column extraction
    // A full implementation would need a proper SQL parser

    // SELECT clause columns (excluding *)
    const selectMatches = sql.match(/\bSELECT\s+((?:(?!\bFROM\b)[\s\S])*)/i)
    if (selectMatches && selectMatches[1]) {
      const selectClause = selectMatches[1]
      if (!selectClause.includes('*')) {
        const columnList = selectClause.split(',')
        columnList.forEach((col) => {
          const cleanCol = this.cleanIdentifier(col.trim())
          if (cleanCol && !this.isFunction(cleanCol)) {
            columns.add(cleanCol)
          }
        })
      }
    }

    return Array.from(columns)
  }

  /**
   * Extract function calls from the query
   */
  private extractFunctions(): string[] {
    const functions = new Set<string>()

    // Match function calls: FUNCTION_NAME(
    const functionMatches = this.sql.matchAll(/\b([A-Za-z_][A-Za-z0-9_]*)\s*\(/g)

    for (const match of functionMatches) {
      const functionName = match[1].toUpperCase()
      functions.add(functionName)
    }

    return Array.from(functions)
  }

  /**
   * Extract schema names referenced in the query
   */
  private extractSchemas(): string[] {
    const schemas = new Set<string>()
    // Find schema.table patterns after FROM or JOIN keywords
    // Updated pattern to handle various schema names including underscores
    const fromJoinPattern = /(?:FROM|JOIN)\s+([A-Za-z_][A-Za-z0-9_]*\.[A-Za-z_][A-Za-z0-9_]*)/gi

    let match
    while ((match = fromJoinPattern.exec(this.sql)) !== null) {
      const fullIdentifier = match[1]
      const parts = fullIdentifier.split('.')
      if (parts.length === 2) {
        const schemaName = parts[0].toLowerCase()
        schemas.add(schemaName)
      }
    }

    // Also look for any schema.table pattern anywhere in the query (broader search)
    const broadPattern = /\b([A-Za-z_][A-Za-z0-9_]*)\\.([A-Za-z_][A-Za-z0-9_]*)/g
    let broadMatch
    while ((broadMatch = broadPattern.exec(this.sql)) !== null) {
      const schemaName = broadMatch[1].toLowerCase()
      schemas.add(schemaName)
    }

    // If no explicit schemas found, assume 'public'
    if (schemas.size === 0) {
      schemas.add('public')
    }

    return Array.from(schemas)
  }

  /**
   * Analyze query characteristics
   */
  private analyzeQuery(): {
    hasSubqueries: boolean
    hasCTEs: boolean
    hasWindowFunctions: boolean
    isModifying: boolean
    isReadOnly: boolean
  } {
    const sql = this.normalizedSql.toUpperCase()

    const hasSubqueries =
      sql.includes('(') &&
      (/\(\s*SELECT\b/i.test(sql) ||
        /\bEXISTS\s*\(/i.test(sql) ||
        /\bIN\s*\(\s*SELECT\b/i.test(sql))
    const hasCTEs = sql.includes('WITH ')
    const hasWindowFunctions = /\bOVER\s*\(/.test(sql)

    const modifyingKeywords = ['INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP', 'TRUNCATE']
    const isModifying = modifyingKeywords.some((keyword) => sql.includes(keyword))
    const isReadOnly = !isModifying

    return {
      hasSubqueries,
      hasCTEs,
      hasWindowFunctions,
      isModifying,
      isReadOnly,
    }
  }

  /**
   * Calculate query complexity
   */
  public calculateComplexity(): QueryComplexity {
    const analysis = this.analyzeQuery()
    let complexityScore = 0

    // Base complexity
    complexityScore += 10

    // Add complexity for various features
    if (analysis.hasSubqueries) complexityScore += 20
    if (analysis.hasCTEs) complexityScore += 15
    if (analysis.hasWindowFunctions) complexityScore += 25

    // Add complexity for number of tables
    const tables = this.extractTables()
    complexityScore += Math.max(0, (tables.length - 1) * 5)

    // Add complexity for functions
    const functions = this.extractFunctions()
    complexityScore += functions.length * 3

    if (complexityScore <= 15) return QueryComplexity.SIMPLE
    if (complexityScore <= 35) return QueryComplexity.MODERATE
    if (complexityScore <= 60) return QueryComplexity.COMPLEX
    return QueryComplexity.VERY_COMPLEX
  }

  /**
   * Helper method to clean identifiers (remove quotes, etc.)
   */
  private cleanIdentifier(identifier: string): string {
    let cleaned = identifier
      .replace(/\s+AS\s+.*$/i, '') // Remove AS aliases first
      .trim()

    // Handle quoted identifiers - preserve the content inside quotes
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1)
    } else if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
      cleaned = cleaned.slice(1, -1)
    } else if (cleaned.startsWith('`') && cleaned.endsWith('`')) {
      cleaned = cleaned.slice(1, -1)
    }

    return cleaned
  }

  /**
   * Remove SQL comments from the query
   */
  private removeComments(sql: string): string {
    // Handle both literal \n and actual newlines
    let cleaned = sql.replace(/\\n/g, '\n')

    // Remove single-line comments (-- comment)
    cleaned = cleaned.replace(/--.*$/gm, '')

    // Clean up extra whitespace and newlines
    cleaned = cleaned
      .replace(/\n\s*\n/g, '\n')
      .replace(/\s+/g, ' ')
      .trim()

    return cleaned
  }

  /**
   * Check if a string looks like a function call
   */
  private isFunction(str: string): boolean {
    return /\w+\s*\(/.test(str)
  }
}
