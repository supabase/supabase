/**
 * Core types for SQL query analysis
 */

export enum QueryCategory {
  DDL = 'DDL',           // Data Definition Language (CREATE, ALTER, DROP)
  DML = 'DML',           // Data Manipulation Language (SELECT, INSERT, UPDATE, DELETE)
  DCL = 'DCL',           // Data Control Language (GRANT, REVOKE)
  TCL = 'TCL',           // Transaction Control Language (COMMIT, ROLLBACK)
  UTILITY = 'UTILITY',   // Administrative commands (VACUUM, ANALYZE)
  FUNCTION = 'FUNCTION', // Function calls and procedures
  UNKNOWN = 'UNKNOWN'
}

export enum QuerySubcategory {
  // DDL
  TABLE_CREATION = 'table_creation',
  TABLE_ALTERATION = 'table_alteration',
  TABLE_DELETION = 'table_deletion',
  INDEX_CREATION = 'index_creation',
  INDEX_DELETION = 'index_deletion',
  FUNCTION_CREATION = 'function_creation',
  FUNCTION_DELETION = 'function_deletion',
  SCHEMA_CREATION = 'schema_creation',
  
  // DML
  DATA_QUERY = 'data_query',
  DATA_INSERT = 'data_insert',
  DATA_UPDATE = 'data_update',
  DATA_DELETE = 'data_delete',
  
  // DCL
  PERMISSION_GRANT = 'permission_grant',
  PERMISSION_REVOKE = 'permission_revoke',
  RLS_POLICY = 'rls_policy',
  
  // Function calls
  AGGREGATE_FUNCTION = 'aggregate_function',
  WINDOW_FUNCTION = 'window_function',
  USER_FUNCTION = 'user_function',
  BUILTIN_FUNCTION = 'builtin_function'
}

export enum QueryRiskLevel {
  LOW = 'low',         // Read-only operations, safe functions
  MEDIUM = 'medium',   // Data modifications, schema changes
  HIGH = 'high',       // Dangerous operations, admin functions
  CRITICAL = 'critical' // System-level operations
}

export enum QueryComplexity {
  SIMPLE = 'simple',       // Single table, basic operations
  MODERATE = 'moderate',   // Joins, subqueries
  COMPLEX = 'complex',     // CTEs, window functions, complex joins
  VERY_COMPLEX = 'very_complex' // Recursive CTEs, multiple levels of nesting
}

export interface ParsedQuery {
  /** Original SQL string */
  originalSql: string
  
  /** Normalized SQL (cleaned, formatted) */
  normalizedSql: string
  
  /** Main operation type */
  operation: string
  
  /** Tables referenced in the query */
  tables: string[]
  
  /** Columns referenced in the query */
  columns: string[]
  
  /** Functions called in the query */
  functions: string[]
  
  /** Schemas referenced */
  schemas: string[]
  
  /** Whether query has subqueries */
  hasSubqueries: boolean
  
  /** Whether query has CTEs */
  hasCTEs: boolean
  
  /** Whether query has window functions */
  hasWindowFunctions: boolean
  
  /** Whether query modifies data */
  isModifying: boolean
  
  /** Whether query is read-only */
  isReadOnly: boolean
}

export interface RequiredPermission {
  /** Permission type (SELECT, INSERT, UPDATE, DELETE, etc.) */
  type: string
  
  /** Target object (table, function, schema) */
  target: string
  
  /** Schema containing the target */
  schema?: string
  
  /** Whether this permission is required or optional */
  required: boolean
}

export interface SecurityWarning {
  /** Warning severity level */
  level: 'info' | 'warning' | 'error'
  
  /** Warning message */
  message: string
  
  /** Location in SQL where warning applies */
  location?: {
    line: number
    column: number
    length?: number
  }
  
  /** Suggested fix or mitigation */
  suggestion?: string
}

export interface PerformanceEstimate {
  /** Estimated complexity score (1-100) */
  complexityScore: number
  
  /** Estimated execution time category */
  timeCategory: 'fast' | 'moderate' | 'slow' | 'very_slow'
  
  /** Factors affecting performance */
  factors: string[]
  
  /** Suggested optimizations */
  optimizations?: string[]
}