import { 
  SecurityReport, 
  SecurityConfig, 
  DataAccessPattern,
  SecurityRecommendation,
  DataClassification
} from '../types/SecurityReport'
import { 
  QueryRiskLevel, 
  RequiredPermission, 
  SecurityWarning, 
  PerformanceEstimate,
  ParsedQuery,
  QueryCategory,
  QueryComplexity
} from '../types/QueryTypes'
import { checkSecurityRules } from '../utils/SafetyRules'
import { isDangerousFunction, isSystemCatalog, isSystemSchema } from '../utils/PostgresKeywords'

/**
 * Performs comprehensive security analysis on SQL queries
 */
export class SecurityAnalyzer {
  private config: SecurityConfig
  private parsedQuery: ParsedQuery
  private category: QueryCategory
  private complexity: QueryComplexity

  constructor(
    parsedQuery: ParsedQuery,
    category: QueryCategory,
    complexity: QueryComplexity,
    config: Partial<SecurityConfig> = {}
  ) {
    this.parsedQuery = parsedQuery
    this.category = category
    this.complexity = complexity
    this.config = this.mergeWithDefaults(config)
  }

  /**
   * Perform comprehensive security analysis
   */
  public analyzeQuery(): SecurityReport {
    const ruleAnalysis = this.analyzeSecurityRules()
    const permissionAnalysis = this.analyzePermissions()
    const dataAccessAnalysis = this.analyzeDataAccess()
    const performanceAnalysis = this.analyzePerformance()
    const recommendations = this.generateRecommendations()

    const riskLevel = this.calculateRiskLevel(ruleAnalysis.highestRiskLevel)
    const riskScore = this.calculateRiskScore()
    const aiExecutable = this.determineAiExecutability(riskLevel)
    const requiresElevatedPrivileges = this.checkElevatedPrivileges()

    return {
      riskLevel,
      riskScore,
      requiredPermissions: permissionAnalysis,
      warnings: ruleAnalysis.warnings,
      performance: performanceAnalysis,
      aiExecutable,
      requiresElevatedPrivileges,
      dataAccess: dataAccessAnalysis,
      recommendations
    }
  }

  /**
   * Analyze security rules and generate warnings
   */
  private analyzeSecurityRules(): {
    warnings: SecurityWarning[]
    highestRiskLevel: QueryRiskLevel
  } {
    const { matchedRules, highestRiskLevel } = checkSecurityRules(
      this.parsedQuery.originalSql,
      this.config.customRules
    )

    const warnings: SecurityWarning[] = matchedRules.map(rule => ({
      level: this.riskLevelToWarningLevel(rule.riskLevel),
      message: rule.message || `Security rule violated: ${rule.name}`,
      suggestion: `Review ${rule.description.toLowerCase()}`
    }))

    // Add function-specific warnings
    this.parsedQuery.functions.forEach(func => {
      if (isDangerousFunction(func)) {
        warnings.push({
          level: 'error',
          message: `Dangerous function detected: ${func}`,
          suggestion: 'Avoid using system-level functions in user queries'
        })
      }
    })

    // Add schema warnings
    this.parsedQuery.schemas.forEach(schema => {
      if (isSystemSchema(schema)) {
        warnings.push({
          level: 'warning',
          message: `Access to system schema: ${schema}`,
          suggestion: 'Be cautious when accessing system schemas'
        })
      }
      
      // Check if schema is allowed
      if (!this.config.allowedSchemas.includes(schema) && !this.config.allowedSchemas.includes('*')) {
        warnings.push({
          level: 'warning',
          message: `Access to restricted schema: ${schema}`,
          suggestion: `Only schemas ${this.config.allowedSchemas.join(', ')} are allowed`
        })
      }
    })
    
    // Add system catalog warnings
    this.parsedQuery.tables.forEach(table => {
      if (isSystemCatalog(table)) {
        warnings.push({
          level: 'warning',
          message: `Access to system catalog: ${table}`,
          suggestion: 'Be cautious when accessing system catalogs'
        })
      }
    })
    
    // Add read-only mode warnings
    if (this.config.readOnlyMode && !this.parsedQuery.isReadOnly) {
      warnings.push({
        level: 'error',
        message: 'Modifying operations are not allowed in read-only mode',
        suggestion: 'Use SELECT queries only in read-only mode'
      })
    }

    return { warnings, highestRiskLevel }
  }

  /**
   * Analyze required permissions for the query
   */
  private analyzePermissions(): RequiredPermission[] {
    const permissions: RequiredPermission[] = []

    // Determine permissions based on operation and tables
    if (this.parsedQuery.isReadOnly) {
      // SELECT permissions
      this.parsedQuery.tables.forEach(table => {
        permissions.push({
          type: 'SELECT',
          target: table,
          schema: this.extractSchemaFromTable(table),
          required: true
        })
      })
    } else {
      // Write permissions
      const operation = this.parsedQuery.operation.toUpperCase()
      
      if (operation.startsWith('INSERT')) {
        this.parsedQuery.tables.forEach(table => {
          permissions.push({
            type: 'INSERT',
            target: table,
            schema: this.extractSchemaFromTable(table),
            required: true
          })
        })
      }
      
      if (operation.startsWith('UPDATE')) {
        this.parsedQuery.tables.forEach(table => {
          permissions.push({
            type: 'UPDATE',
            target: table,
            schema: this.extractSchemaFromTable(table),
            required: true
          })
        })
      }
      
      if (operation.startsWith('DELETE')) {
        this.parsedQuery.tables.forEach(table => {
          permissions.push({
            type: 'DELETE',
            target: table,
            schema: this.extractSchemaFromTable(table),
            required: true
          })
        })
      }
      
      if (operation.startsWith('CREATE')) {
        permissions.push({
          type: 'CREATE',
          target: operation.includes('TABLE') ? 'TABLE' : 'OBJECT',
          schema: this.parsedQuery.schemas[0] || 'public',
          required: true
        })
      }
    }

    // Function execution permissions
    this.parsedQuery.functions.forEach(func => {
      permissions.push({
        type: 'EXECUTE',
        target: func,
        required: !this.isSafeBuiltinFunction(func)
      })
    })

    return permissions
  }

  /**
   * Analyze data access patterns
   */
  private analyzeDataAccess(): DataAccessPattern {
    const tablesRead: string[] = []
    const tablesModified: string[] = []
    
    if (this.parsedQuery.isReadOnly) {
      tablesRead.push(...this.parsedQuery.tables)
    } else {
      tablesModified.push(...this.parsedQuery.tables)
    }

    const accessesSensitiveData = this.checkSensitiveDataAccess()
    const dataClassifications = this.classifyDataAccess()
    const estimatedRowsAffected = this.estimateRowsAffected()

    return {
      tablesRead,
      tablesModified,
      estimatedRowsAffected,
      accessesSensitiveData,
      dataClassifications
    }
  }

  /**
   * Analyze performance impact
   */
  private analyzePerformance(): PerformanceEstimate {
    let complexityScore = 10 // Base score
    const factors: string[] = []
    const optimizations: string[] = []

    // Complexity factors
    if (this.parsedQuery.hasSubqueries) {
      complexityScore += 20
      factors.push('Contains subqueries')
    }

    if (this.parsedQuery.hasCTEs) {
      complexityScore += 15
      factors.push('Uses Common Table Expressions (CTEs)')
    }

    if (this.parsedQuery.hasWindowFunctions) {
      complexityScore += 25
      factors.push('Uses window functions')
    }

    // Table complexity
    if (this.parsedQuery.tables.length > 3) {
      complexityScore += (this.parsedQuery.tables.length - 3) * 10
      factors.push(`Joins ${this.parsedQuery.tables.length} tables`)
      optimizations.push('Consider breaking into smaller queries')
    }

    // Function complexity
    if (this.parsedQuery.functions.length > 5) {
      complexityScore += (this.parsedQuery.functions.length - 5) * 5
      factors.push('Uses many functions')
    }

    // SELECT * warning
    if (this.parsedQuery.originalSql.toUpperCase().includes('SELECT *')) {
      complexityScore += 10
      factors.push('Uses SELECT *')
      optimizations.push('Select only needed columns')
    }

    // Missing WHERE clause on large operations
    if (!this.parsedQuery.originalSql.toUpperCase().includes('WHERE') && 
        !this.parsedQuery.isReadOnly) {
      complexityScore += 30
      factors.push('No WHERE clause on data modification')
      optimizations.push('Add WHERE clause to limit affected rows')
    }

    const timeCategory = this.getTimeCategory(complexityScore)

    return {
      complexityScore,
      timeCategory,
      factors,
      optimizations: optimizations.length > 0 ? optimizations : []
    }
  }

  /**
   * Generate security recommendations
   */
  private generateRecommendations(): SecurityRecommendation[] {
    const recommendations: SecurityRecommendation[] = []

    // Read-only mode recommendation
    if (!this.parsedQuery.isReadOnly && this.config.readOnlyMode) {
      recommendations.push({
        type: 'security',
        priority: 'high',
        message: 'Query modifies data but system is in read-only mode',
        implementation: 'Use read-only connection or enable write access'
      })
    }

    // Schema access recommendations
    this.parsedQuery.schemas.forEach(schema => {
      if (!this.config.allowedSchemas.includes(schema) && 
          !this.config.allowedSchemas.includes('*')) {
        recommendations.push({
          type: 'security',
          priority: 'medium',
          message: `Access to schema '${schema}' may not be allowed`,
          implementation: 'Verify schema access permissions'
        })
      }
    })

    // Function recommendations
    this.parsedQuery.functions.forEach(func => {
      if (this.config.blockedFunctions.includes(func)) {
        recommendations.push({
          type: 'security',
          priority: 'high',
          message: `Function '${func}' is blocked by security policy`,
          implementation: 'Use alternative functions or request permission'
        })
      }
    })

    // Performance recommendations
    if (this.complexity === QueryComplexity.VERY_COMPLEX) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        message: 'Query is very complex and may impact performance',
        implementation: 'Consider breaking into smaller queries or adding indexes'
      })
    }

    return recommendations
  }

  /**
   * Calculate overall risk level
   */
  private calculateRiskLevel(ruleRiskLevel: QueryRiskLevel): QueryRiskLevel {
    const factors = [ruleRiskLevel]

    // Category-based risk
    if (this.category === QueryCategory.DDL) factors.push(QueryRiskLevel.MEDIUM)
    if (this.category === QueryCategory.DCL) factors.push(QueryRiskLevel.HIGH)
    if (this.category === QueryCategory.UTILITY) factors.push(QueryRiskLevel.HIGH)

    // Dangerous functions
    if (this.parsedQuery.functions.some(f => isDangerousFunction(f))) {
      factors.push(QueryRiskLevel.CRITICAL)
    }

    // System access
    if (this.parsedQuery.tables.some(t => isSystemCatalog(t))) {
      factors.push(QueryRiskLevel.HIGH)
    }

    // Return highest risk level
    const riskOrder = [QueryRiskLevel.LOW, QueryRiskLevel.MEDIUM, QueryRiskLevel.HIGH, QueryRiskLevel.CRITICAL]
    return factors.reduce((highest, current) => 
      riskOrder.indexOf(current) > riskOrder.indexOf(highest) ? current : highest
    )
  }

  /**
   * Calculate numeric risk score (0-100)
   */
  private calculateRiskScore(): number {
    let score = 0

    // Base score by category
    switch (this.category) {
      case QueryCategory.DML:
        score += this.parsedQuery.isReadOnly ? 10 : 30
        break
      case QueryCategory.DDL:
        score += 50
        break
      case QueryCategory.DCL:
        score += 70
        break
      case QueryCategory.UTILITY:
        score += 80
        break
      default:
        score += 20
    }

    // Complexity penalty
    switch (this.complexity) {
      case QueryComplexity.MODERATE:
        score += 10
        break
      case QueryComplexity.COMPLEX:
        score += 20
        break
      case QueryComplexity.VERY_COMPLEX:
        score += 30
        break
    }

    // Dangerous functions
    const dangerousFunctions = this.parsedQuery.functions.filter(f => isDangerousFunction(f))
    score += dangerousFunctions.length * 20

    // System access
    const systemTables = this.parsedQuery.tables.filter(t => isSystemCatalog(t))
    score += systemTables.length * 15

    return Math.min(100, score)
  }

  /**
   * Determine if query is executable by AI
   */
  private determineAiExecutability(riskLevel: QueryRiskLevel): boolean {
    // Block high-risk and critical operations
    if (riskLevel === QueryRiskLevel.HIGH || riskLevel === QueryRiskLevel.CRITICAL) {
      return false
    }

    // Block modifying operations in read-only mode
    if (this.config.readOnlyMode && !this.parsedQuery.isReadOnly) {
      return false
    }

    // Block DDL operations like DROP TABLE
    if (this.parsedQuery.operation.toUpperCase().includes('DROP')) {
      return false
    }

    // Block DELETE and UPDATE without WHERE clause (high risk operations)
    const sql = this.parsedQuery.originalSql.toUpperCase()
    if ((sql.includes('DELETE FROM') || sql.includes('UPDATE ')) && !sql.includes('WHERE')) {
      return false
    }

    // Block if query uses dangerous functions
    const hasDangerousFunctions = this.parsedQuery.functions.some(func => 
      isDangerousFunction(func)
    )
    if (hasDangerousFunctions) {
      return false
    }

    return true
  }

  /**
   * Check if query requires elevated privileges
   */
  private checkElevatedPrivileges(): boolean {
    // DDL operations typically require elevated privileges
    if (this.category === QueryCategory.DDL) return true
    if (this.category === QueryCategory.DCL) return true
    if (this.category === QueryCategory.UTILITY) return true
    
    // System function calls
    if (this.parsedQuery.functions.some(f => isDangerousFunction(f))) return true
    
    // System catalog access
    if (this.parsedQuery.tables.some(t => isSystemCatalog(t))) return true
    
    return false
  }

  // Helper methods
  private mergeWithDefaults(config: Partial<SecurityConfig>): SecurityConfig {
    return {
      allowedSchemas: config.allowedSchemas || ['public'],
      blockedFunctions: config.blockedFunctions || [],
      maxComplexity: config.maxComplexity || 75,
      requireExplicitPermissions: config.requireExplicitPermissions || false,
      readOnlyMode: config.readOnlyMode || false,
      customRules: config.customRules || [],
      dataClassificationRules: config.dataClassificationRules || []
    }
  }

  private riskLevelToWarningLevel(risk: QueryRiskLevel): SecurityWarning['level'] {
    switch (risk) {
      case QueryRiskLevel.LOW: return 'info'
      case QueryRiskLevel.MEDIUM: return 'warning'
      case QueryRiskLevel.HIGH: 
      case QueryRiskLevel.CRITICAL: return 'error'
    }
  }

  private extractSchemaFromTable(table: string): string {
    const parts = table.split('.')
    return parts.length > 1 ? parts[0] : 'public'
  }

  private isSafeBuiltinFunction(func: string): boolean {
    // Import and use the actual SAFE_BUILTIN_FUNCTIONS set
    try {
      const { isSafeFunction } = require('../utils/PostgresKeywords')
      return isSafeFunction(func)
    } catch {
      // Fallback if import fails
      return true
    }
  }

  private checkSensitiveDataAccess(): boolean {
    return this.parsedQuery.tables.some(table => 
      table.toLowerCase().includes('password') ||
      table.toLowerCase().includes('secret') ||
      table.toLowerCase().includes('private')
    )
  }

  private classifyDataAccess(): DataClassification[] {
    // Simplified implementation
    return [{
      level: 'public',
      targets: this.parsedQuery.tables
    }]
  }

  private estimateRowsAffected(): number {
    if (this.parsedQuery.originalSql.toUpperCase().includes('WHERE')) {
      return 100 // Estimated with WHERE clause
    }
    return 1000 // Estimated without WHERE clause
  }

  private getTimeCategory(score: number): PerformanceEstimate['timeCategory'] {
    if (score <= 30) return 'fast'
    if (score <= 60) return 'moderate'
    if (score <= 90) return 'slow'
    return 'very_slow'
  }
}