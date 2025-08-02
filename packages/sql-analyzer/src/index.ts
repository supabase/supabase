/**
 * @supabase/sql-analyzer - Advanced SQL analysis engine for security, classification, and AI assistance
 */

export * from './types/QueryTypes'
export * from './types/SecurityReport'
export * from './parser/SqlParser'
export * from './parser/QueryClassifier'
export * from './parser/SecurityAnalyzer'
export * from './utils/PostgresKeywords'
export * from './utils/SafetyRules'

import { QueryClassifier } from './parser/QueryClassifier'
import { SecurityAnalyzer } from './parser/SecurityAnalyzer'
import { SecurityConfig } from './types/SecurityReport'
import { 
  QueryCategory, 
  QuerySubcategory, 
  QueryComplexity, 
  QueryRiskLevel,
  ParsedQuery
} from './types/QueryTypes'

/**
 * Main analysis result interface
 */
export interface SqlAnalysisResult {
  /** Parsed query structure */
  query: ParsedQuery
  
  /** Query classification */
  category: QueryCategory
  subcategory: QuerySubcategory | null
  complexity: QueryComplexity
  
  /** Security analysis */
  riskLevel: QueryRiskLevel
  riskScore: number
  aiExecutable: boolean
  requiresElevatedPrivileges: boolean
  
  /** Recommendations and warnings */
  warnings: Array<{
    level: 'info' | 'warning' | 'error'
    message: string
    suggestion?: string
  }>
  
  /** Performance impact */
  performance: {
    complexityScore: number
    timeCategory: 'fast' | 'moderate' | 'slow' | 'very_slow'
    factors: string[]
    optimizations?: string[]
  }
  
  /** Required permissions */
  requiredPermissions: Array<{
    type: string
    target: string
    schema?: string
    required: boolean
  }>
  
  /** AI-specific metadata */
  aiPromptType: string
}

/**
 * Options for SQL analysis
 */
export interface AnalysisOptions {
  /** PostgreSQL dialect version (default: latest) */
  dialect?: 'postgresql'
  
  /** Current schema context */
  schema?: string
  
  /** User permissions context */
  permissions?: string[]
  
  /** Whether connection is read-only */
  readOnlyMode?: boolean
  
  /** Custom security configuration */
  securityConfig?: Partial<SecurityConfig>
}

/**
 * Main entry point for SQL analysis
 * 
 * @param sql - The SQL query to analyze
 * @param options - Analysis configuration options
 * @returns Comprehensive analysis result
 * 
 * @example
 * ```typescript
 * import { analyzeSqlQuery } from '@supabase/sql-analyzer'
 * 
 * const result = await analyzeSqlQuery('SELECT * FROM users WHERE id = 1', {
 *   readOnlyMode: true,
 *   schema: 'public'
 * })
 * 
 * if (result.aiExecutable) {
 *   console.log('Safe for AI execution')
 * }
 * 
 * console.log(`Risk level: ${result.riskLevel}`)
 * console.log(`AI prompt type: ${result.aiPromptType}`)
 * ```
 */
export async function analyzeSqlQuery(
  sql: string,
  options: AnalysisOptions = {}
): Promise<SqlAnalysisResult> {
  // Set up security configuration
  const securityConfig: Partial<SecurityConfig> = {
    readOnlyMode: options.readOnlyMode || false,
    allowedSchemas: options.schema ? [options.schema] : ['public'],
    ...options.securityConfig
  }

  // Parse and classify the query
  const classification = QueryClassifier.classify(sql)
  const { category, subcategory, complexity, parsedQuery } = classification

  // Analyze security
  const securityAnalyzer = new SecurityAnalyzer(
    parsedQuery,
    category,
    complexity,
    securityConfig
  )
  const securityReport = securityAnalyzer.analyzeQuery()

  // Generate AI prompt type
  const aiPromptType = QueryClassifier.getAiPromptType(category, subcategory)

  return {
    query: parsedQuery,
    category,
    subcategory,
    complexity,
    riskLevel: securityReport.riskLevel,
    riskScore: securityReport.riskScore,
    aiExecutable: securityReport.aiExecutable,
    requiresElevatedPrivileges: securityReport.requiresElevatedPrivileges,
    warnings: securityReport.warnings,
    performance: securityReport.performance,
    requiredPermissions: securityReport.requiredPermissions,
    aiPromptType
  }
}

/**
 * Quick check if a query is safe for AI execution
 * 
 * @param sql - The SQL query to check
 * @param options - Analysis options
 * @returns True if safe for AI execution
 * 
 * @example
 * ```typescript
 * import { isQuerySafeForAi } from '@supabase/sql-analyzer'
 * 
 * const safe = await isQuerySafeForAi('SELECT name FROM users LIMIT 10')
 * if (safe) {
 *   // Execute query
 * }
 * ```
 */
export async function isQuerySafeForAi(
  sql: string,
  options: AnalysisOptions = {}
): Promise<boolean> {
  const result = await analyzeSqlQuery(sql, options)
  return result.aiExecutable
}

/**
 * Get the appropriate AI prompt type for a query
 * 
 * @param sql - The SQL query to analyze
 * @returns AI prompt type string
 * 
 * @example
 * ```typescript
 * import { getAiPromptType } from '@supabase/sql-analyzer'
 * 
 * const promptType = await getAiPromptType('CREATE TABLE users (id serial primary key)')
 * console.log(promptType) // 'create_table'
 * ```
 */
export async function getAiPromptType(sql: string): Promise<string> {
  const result = await analyzeSqlQuery(sql)
  return result.aiPromptType
}

/**
 * Format a security report for display
 * 
 * @param result - Analysis result
 * @returns Formatted security report
 */
export function formatSecurityReport(result: SqlAnalysisResult): string {
  const lines: string[] = []
  
  lines.push(`SQL Security Analysis Report`)
  lines.push(`============================`)
  lines.push(``)
  lines.push(`Query: ${result.query.operation}`)
  lines.push(`Category: ${result.category}`)
  lines.push(`Risk Level: ${result.riskLevel} (Score: ${result.riskScore}/100)`)
  lines.push(`AI Executable: ${result.aiExecutable ? 'Yes' : 'No'}`)
  lines.push(``)
  
  if (result.warnings.length > 0) {
    lines.push(`Warnings:`)
    result.warnings.forEach(warning => {
      lines.push(`  [${warning.level.toUpperCase()}] ${warning.message}`)
      if (warning.suggestion) {
        lines.push(`    Suggestion: ${warning.suggestion}`)
      }
    })
    lines.push(``)
  }
  
  if (result.requiredPermissions.length > 0) {
    lines.push(`Required Permissions:`)
    result.requiredPermissions.forEach(perm => {
      const target = perm.schema ? `${perm.schema}.${perm.target}` : perm.target
      lines.push(`  ${perm.type} on ${target}`)
    })
    lines.push(``)
  }
  
  lines.push(`Performance: ${result.performance.timeCategory} (${result.performance.complexityScore}/100)`)
  if (result.performance.factors.length > 0) {
    lines.push(`Factors: ${result.performance.factors.join(', ')}`)
  }
  
  return lines.join('\n')
}

// Default export for convenience
export default {
  analyzeSqlQuery,
  isQuerySafeForAi,
  getAiPromptType,
  formatSecurityReport,
  QueryCategory,
  QueryRiskLevel,
  QueryComplexity
}