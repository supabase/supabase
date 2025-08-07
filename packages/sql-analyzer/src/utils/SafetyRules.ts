import { SecurityRule } from '../types/SecurityReport'
import {QueryRiskLevel} from '../types/QueryTypes'

/**
 * Default security rules for SQL analysis
 */
export const DEFAULT_SECURITY_RULES: SecurityRule[] = [
  // High-risk operations
  {
    id: 'drop-table',
    name: 'DROP TABLE Detection',
    description: 'Detects DROP TABLE statements that permanently delete data',
    pattern: '\\bDROP\\s+TABLE\\b',
    action: 'warn',
    riskLevel: QueryRiskLevel.HIGH,
    message: 'DROP TABLE operations permanently delete data and should be used with caution'
  },
  
  {
    id: 'truncate-table',
    name: 'TRUNCATE TABLE Detection',
    description: 'Detects TRUNCATE statements that remove all data from tables',
    pattern: '\\bTRUNCATE\\s+TABLE?\\b',
    action: 'warn',
    riskLevel: QueryRiskLevel.HIGH,
    message: 'TRUNCATE operations remove all data from tables and cannot be rolled back'
  },
  
  {
    id: 'delete-without-where',
    name: 'DELETE Without WHERE',
    description: 'Detects DELETE statements without WHERE clauses',
    pattern: '\\bDELETE\\s+FROM\\s+\\w+(?!.*\\bWHERE\\b)',
    action: 'warn',
    riskLevel: QueryRiskLevel.HIGH,
    message: 'DELETE without WHERE clause will remove all rows from the table'
  },
  
  {
    id: 'update-without-where',
    name: 'UPDATE Without WHERE',
    description: 'Detects UPDATE statements without WHERE clauses',
    pattern: '\\bUPDATE\\s+\\w+\\s+SET\\s+.*(?!.*\\bWHERE\\b)',
    action: 'warn',
    riskLevel: QueryRiskLevel.HIGH,
    message: 'UPDATE without WHERE clause will modify all rows in the table'
  },
  
  // Dangerous functions
  {
    id: 'dangerous-functions',
    name: 'Dangerous Function Usage',
    description: 'Detects usage of potentially dangerous PostgreSQL functions',
    pattern: '\\b(PG_READ_FILE|PG_TERMINATE_BACKEND|PG_CANCEL_BACKEND|LO_IMPORT|LO_EXPORT)\\s*\\(',
    action: 'block',
    riskLevel: QueryRiskLevel.CRITICAL,
    message: 'This function can perform system-level operations and is not allowed'
  },
  
  // System catalog access
  {
    id: 'system-catalog-modification',
    name: 'System Catalog Modification',
    description: 'Detects attempts to modify PostgreSQL system catalogs',
    pattern: '\\b(INSERT|UPDATE|DELETE)\\s+.*\\b(PG_|INFORMATION_SCHEMA)\\w*\\b',
    action: 'block',
    riskLevel: QueryRiskLevel.CRITICAL,
    message: 'Direct modification of system catalogs is not allowed'
  },
  
  // File operations
  {
    id: 'copy-from-file',
    name: 'COPY FROM File',
    description: 'Detects COPY commands that read from files',
    pattern: '\\bCOPY\\s+.*\\bFROM\\s+[\'"].*[\'"]',
    action: 'warn',
    riskLevel: QueryRiskLevel.HIGH,
    message: 'COPY FROM file operations require careful review for security'
  },
  
  {
    id: 'copy-to-file',
    name: 'COPY TO File',
    description: 'Detects COPY commands that write to files',
    pattern: '\\bCOPY\\s+.*\\bTO\\s+[\'"].*[\'"]',
    action: 'warn',
    riskLevel: QueryRiskLevel.HIGH,
    message: 'COPY TO file operations can expose sensitive data'
  },
  
  // Dynamic SQL
  {
    id: 'execute-statement',
    name: 'Dynamic SQL Execution',
    description: 'Detects EXECUTE statements with dynamic SQL',
    pattern: '\\bEXECUTE\\s+',
    action: 'warn',
    riskLevel: QueryRiskLevel.HIGH,
    message: 'Dynamic SQL execution can be vulnerable to injection attacks'
  },
  
  // Medium-risk operations
  {
    id: 'create-function',
    name: 'Function Creation',
    description: 'Detects creation of user-defined functions',
    pattern: '\\bCREATE\\s+(OR\\s+REPLACE\\s+)?FUNCTION\\b',
    action: 'warn',
    riskLevel: QueryRiskLevel.MEDIUM,
    message: 'Creating functions requires review for security and performance implications'
  },
  
  {
    id: 'alter-system',
    name: 'ALTER SYSTEM',
    description: 'Detects ALTER SYSTEM statements that modify server configuration',
    pattern: '\\bALTER\\s+SYSTEM\\b',
    action: 'block',
    riskLevel: QueryRiskLevel.CRITICAL,
    message: 'ALTER SYSTEM operations modify server configuration and are not allowed'
  },
  
  // User and role management
  {
    id: 'create-user-role',
    name: 'User/Role Creation',
    description: 'Detects creation of users or roles',
    pattern: '\\bCREATE\\s+(USER|ROLE)\\b',
    action: 'warn',
    riskLevel: QueryRiskLevel.MEDIUM,
    message: 'Creating users or roles requires administrative privileges'
  },
  
  {
    id: 'grant-superuser',
    name: 'Superuser Grant',
    description: 'Detects attempts to grant superuser privileges',
    pattern: '\\bGRANT\\s+.*\\bSUPERUSER\\b',
    action: 'block',
    riskLevel: QueryRiskLevel.CRITICAL,
    message: 'Granting superuser privileges is not allowed'
  },
  
  // Password operations
  {
    id: 'password-in-query',
    name: 'Password in SQL',
    description: 'Detects potential passwords in SQL statements',
    pattern: '\\bPASSWORD\\s+[\'"][^\'"]+[\'"]',
    action: 'warn',
    riskLevel: QueryRiskLevel.MEDIUM,
    message: 'Passwords should not be included directly in SQL statements'
  },
  
  // Large data operations
  {
    id: 'select-all-large-table',
    name: 'SELECT * from Large Table',
    description: 'Warns about SELECT * operations that might return large datasets',
    pattern: '\\bSELECT\\s+\\*\\s+FROM\\s+\\w+(?!.*\\bLIMIT\\b)',
    action: 'warn',
    riskLevel: QueryRiskLevel.LOW,
    message: 'SELECT * without LIMIT may return large datasets and impact performance'
  },
  
  // Extension operations
  {
    id: 'create-extension',
    name: 'Extension Creation',
    description: 'Detects creation of PostgreSQL extensions',
    pattern: '\\bCREATE\\s+EXTENSION\\b',
    action: 'warn',
    riskLevel: QueryRiskLevel.MEDIUM,
    message: 'Creating extensions requires superuser privileges and should be reviewed'
  },
  
  // Backup and restore operations
  {
    id: 'backup-operations',
    name: 'Backup Operations',
    description: 'Detects backup-related function calls',
    pattern: '\\b(PG_START_BACKUP|PG_STOP_BACKUP|PG_CREATE_RESTORE_POINT)\\s*\\(',
    action: 'warn',
    riskLevel: QueryRiskLevel.HIGH,
    message: 'Backup operations require special privileges and should be carefully managed'
  }
]

/**
 * Get security rules filtered by risk level
 */
export function getRulesByRiskLevel(riskLevel: QueryRiskLevel): SecurityRule[] {
  return DEFAULT_SECURITY_RULES.filter(rule => rule.riskLevel === riskLevel)
}

/**
 * Get security rules filtered by action
 */
export function getRulesByAction(action: SecurityRule['action']): SecurityRule[] {
  return DEFAULT_SECURITY_RULES.filter(rule => rule.action === action)
}

/**
 * Check if a SQL statement matches any security rule
 */
export function checkSecurityRules(
  sql: string, 
  customRules: SecurityRule[] = []
): { matchedRules: SecurityRule[], highestRiskLevel: QueryRiskLevel } {
  const allRules = [...DEFAULT_SECURITY_RULES, ...customRules]
  const matchedRules: SecurityRule[] = []
  let highestRiskLevel = QueryRiskLevel.LOW
  
  for (const rule of allRules) {
    const regex = new RegExp(rule.pattern, 'gi')
    if (regex.test(sql)) {
      matchedRules.push(rule)
      
      // Update highest risk level
      const riskLevels = [QueryRiskLevel.LOW, QueryRiskLevel.MEDIUM, QueryRiskLevel.HIGH, QueryRiskLevel.CRITICAL]
      const currentRiskIndex = riskLevels.indexOf(rule.riskLevel)
      const highestRiskIndex = riskLevels.indexOf(highestRiskLevel)
      
      if (currentRiskIndex > highestRiskIndex) {
        highestRiskLevel = rule.riskLevel
      }
    }
  }
  
  return { matchedRules, highestRiskLevel }
}

/**
 * Default configuration for common use cases
 */
export const SECURITY_CONFIGS = {
  /** Strict configuration for production AI assistant */
  AI_ASSISTANT_STRICT: {
    allowedSchemas: ['public'],
    blockedFunctions: [
      'PG_READ_FILE', 'PG_TERMINATE_BACKEND', 'PG_CANCEL_BACKEND',
      'LO_IMPORT', 'LO_EXPORT', 'COPY', 'EXECUTE'
    ],
    maxComplexity: 50,
    requireExplicitPermissions: true,
    readOnlyMode: true,
    customRules: getRulesByAction('block')
  },
  
  /** Moderate configuration for development */
  DEVELOPMENT: {
    allowedSchemas: ['public', 'dev', 'test'],
    blockedFunctions: [
      'PG_TERMINATE_BACKEND', 'PG_CANCEL_BACKEND', 'ALTER_SYSTEM'
    ],
    maxComplexity: 75,
    requireExplicitPermissions: false,
    readOnlyMode: false,
    customRules: getRulesByRiskLevel(QueryRiskLevel.CRITICAL)
  },
  
  /** Permissive configuration for admin users */
  ADMIN: {
    allowedSchemas: ['*'],
    blockedFunctions: [],
    maxComplexity: 100,
    requireExplicitPermissions: false,
    readOnlyMode: false,
    customRules: []
  }
}