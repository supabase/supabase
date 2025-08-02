import { 
  QueryRiskLevel, 
  RequiredPermission, 
  SecurityWarning, 
  PerformanceEstimate 
} from './QueryTypes'

/**
 * Comprehensive security analysis result
 */
export interface SecurityReport {
  /** Overall risk assessment */
  riskLevel: QueryRiskLevel
  
  /** Detailed risk score (0-100) */
  riskScore: number
  
  /** Required database permissions */
  requiredPermissions: RequiredPermission[]
  
  /** Security warnings and recommendations */
  warnings: SecurityWarning[]
  
  /** Performance impact analysis */
  performance: PerformanceEstimate
  
  /** Whether query is safe for AI execution */
  aiExecutable: boolean
  
  /** Whether query requires elevated privileges */
  requiresElevatedPrivileges: boolean
  
  /** Data access patterns */
  dataAccess: DataAccessPattern
  
  /** Security recommendations */
  recommendations: SecurityRecommendation[]
}

export interface DataAccessPattern {
  /** Tables that will be read */
  tablesRead: string[]
  
  /** Tables that will be modified */
  tablesModified: string[]
  
  /** Estimated number of rows affected */
  estimatedRowsAffected?: number
  
  /** Whether query accesses sensitive data */
  accessesSensitiveData: boolean
  
  /** Data classification levels accessed */
  dataClassifications: DataClassification[]
}

export interface DataClassification {
  /** Classification level */
  level: 'public' | 'internal' | 'confidential' | 'restricted'
  
  /** Tables/columns with this classification */
  targets: string[]
  
  /** Required additional permissions */
  additionalPermissions?: string[]
}

export interface SecurityRecommendation {
  /** Recommendation type */
  type: 'security' | 'performance' | 'best_practice'
  
  /** Priority level */
  priority: 'low' | 'medium' | 'high' | 'critical'
  
  /** Recommendation message */
  message: string
  
  /** How to implement the recommendation */
  implementation?: string
  
  /** Links to documentation */
  documentation?: string[]
}

/**
 * Configuration for security analysis
 */
export interface SecurityConfig {
  /** Schemas that are allowed to be accessed */
  allowedSchemas: string[]
  
  /** Functions that are blocked from execution */
  blockedFunctions: string[]
  
  /** Maximum query complexity allowed */
  maxComplexity: number
  
  /** Whether to require explicit permissions for all operations */
  requireExplicitPermissions: boolean
  
  /** Whether to run in read-only mode */
  readOnlyMode: boolean
  
  /** Custom security rules */
  customRules?: SecurityRule[]
  
  /** Data classification rules */
  dataClassificationRules?: DataClassificationRule[]
}

export interface SecurityRule {
  /** Rule identifier */
  id: string
  
  /** Rule name */
  name: string
  
  /** Rule description */
  description: string
  
  /** SQL pattern to match (regex) */
  pattern: string
  
  /** Action to take when rule matches */
  action: 'allow' | 'warn' | 'block'
  
  /** Risk level to assign */
  riskLevel: QueryRiskLevel
  
  /** Custom message for violations */
  message?: string
}

export interface DataClassificationRule {
  /** Tables/columns this rule applies to */
  targets: string[]
  
  /** Classification level */
  classification: DataClassification['level']
  
  /** Additional permissions required */
  requiredPermissions: string[]
  
  /** Whether access should be logged */
  requiresAuditLog: boolean
}