import { 
  QueryCategory, 
  QuerySubcategory, 
  QueryComplexity, 
  ParsedQuery 
} from '../types/QueryTypes'
import { getQueryCategoryFromKeyword } from '../utils/PostgresKeywords'
import { SqlParser } from './SqlParser'

/**
 * Classifies SQL queries into categories and subcategories
 */
export class QueryClassifier {
  /**
   * Classify a SQL query and return detailed classification information
   */
  public static classify(sql: string): {
    category: QueryCategory
    subcategory: QuerySubcategory | null
    complexity: QueryComplexity
    parsedQuery: ParsedQuery
  } {
    const parser = new SqlParser(sql)
    const parsedQuery = parser.parse()
    const complexity = parser.calculateComplexity()
    
    const category = this.determineCategory(parsedQuery.operation)
    const subcategory = this.determineSubcategory(parsedQuery.operation, parsedQuery)
    
    return {
      category,
      subcategory,
      complexity,
      parsedQuery
    }
  }

  /**
   * Determine the main category of the query
   */
  private static determineCategory(operation: string): QueryCategory {
    // Handle empty or invalid operations
    if (!operation || operation === 'UNKNOWN') {
      return QueryCategory.UNKNOWN
    }
    
    const category = getQueryCategoryFromKeyword(operation.split(' ')[0])
    
    switch (category) {
      case 'DDL': return QueryCategory.DDL
      case 'DML': return QueryCategory.DML
      case 'DCL': return QueryCategory.DCL
      case 'TCL': return QueryCategory.TCL
      case 'UTILITY': return QueryCategory.UTILITY
      default:
        // Check if it's a function call
        if (operation.includes('(') || this.isFunctionCall(operation)) {
          return QueryCategory.FUNCTION
        }
        return QueryCategory.UNKNOWN
    }
  }

  /**
   * Determine the subcategory of the query
   */
  private static determineSubcategory(
    operation: string, 
    parsedQuery: ParsedQuery
  ): QuerySubcategory | null {
    const upperOperation = operation.toUpperCase()
    
    // DDL subcategories
    if (upperOperation.startsWith('CREATE')) {
      if (upperOperation.includes('TABLE')) return QuerySubcategory.TABLE_CREATION
      if (upperOperation.includes('INDEX')) return QuerySubcategory.INDEX_CREATION
      if (upperOperation.includes('FUNCTION')) return QuerySubcategory.FUNCTION_CREATION
      if (upperOperation.includes('SCHEMA')) return QuerySubcategory.SCHEMA_CREATION
    }
    
    if (upperOperation.startsWith('ALTER')) {
      if (upperOperation.includes('TABLE')) return QuerySubcategory.TABLE_ALTERATION
    }
    
    if (upperOperation.startsWith('DROP')) {
      if (upperOperation.includes('TABLE')) return QuerySubcategory.TABLE_DELETION
      if (upperOperation.includes('INDEX')) return QuerySubcategory.INDEX_DELETION
      if (upperOperation.includes('FUNCTION')) return QuerySubcategory.FUNCTION_DELETION
    }
    
    // DML subcategories
    if (upperOperation === 'SELECT') return QuerySubcategory.DATA_QUERY
    if (upperOperation === 'INSERT') return QuerySubcategory.DATA_INSERT
    if (upperOperation === 'UPDATE') return QuerySubcategory.DATA_UPDATE
    if (upperOperation === 'DELETE') return QuerySubcategory.DATA_DELETE
    
    // DCL subcategories
    if (upperOperation === 'GRANT') return QuerySubcategory.PERMISSION_GRANT
    if (upperOperation === 'REVOKE') return QuerySubcategory.PERMISSION_REVOKE
    
    // Check for RLS policies
    if (upperOperation.includes('POLICY')) return QuerySubcategory.RLS_POLICY
    
    // Function call subcategories
    if (parsedQuery.functions.length > 0) {
      return this.classifyFunctionCall(parsedQuery.functions, parsedQuery.originalSql)
    }
    
    return null
  }

  /**
   * Classify function calls into subcategories
   */
  private static classifyFunctionCall(
    functions: string[], 
    sql: string
  ): QuerySubcategory {
    const upperSql = sql.toUpperCase()
    
    // Check for aggregate functions
    const aggregateFunctions = new Set([
      'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'STDDEV', 'VARIANCE'
    ])
    
    if (functions.some(func => aggregateFunctions.has(func))) {
      return QuerySubcategory.AGGREGATE_FUNCTION
    }
    
    // Check for window functions
    const windowFunctions = new Set([
      'ROW_NUMBER', 'RANK', 'DENSE_RANK', 'LAG', 'LEAD', 'FIRST_VALUE', 'LAST_VALUE'
    ])
    
    if (functions.some(func => windowFunctions.has(func)) || upperSql.includes('OVER (')) {
      return QuerySubcategory.WINDOW_FUNCTION
    }
    
    // Check for built-in functions
    const builtinFunctions = new Set([
      'LENGTH', 'UPPER', 'LOWER', 'SUBSTRING', 'NOW', 'CURRENT_DATE', 'COALESCE'
    ])
    
    if (functions.some(func => builtinFunctions.has(func))) {
      return QuerySubcategory.BUILTIN_FUNCTION
    }
    
    // Assume user-defined function
    return QuerySubcategory.USER_FUNCTION
  }

  /**
   * Check if operation is a function call
   */
  private static isFunctionCall(operation: string): boolean {
    // Simple heuristic - real implementation would be more sophisticated
    // Don't treat malformed keywords as functions
    const malformedKeywords = ['SELET', 'FORM', 'FROOM', 'SELEC', 'SLECT']
    if (malformedKeywords.includes(operation.toUpperCase())) {
      return false
    }
    
    return /^[A-Za-z_][A-Za-z0-9_]*$/.test(operation) && 
           !['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP'].includes(operation.toUpperCase())
  }

  /**
   * Get AI prompt type based on query classification
   */
  public static getAiPromptType(
    category: QueryCategory, 
    subcategory: QuerySubcategory | null
  ): string {
    switch (category) {
      case QueryCategory.DDL:
        if (subcategory === QuerySubcategory.TABLE_CREATION) return 'create_table'
        if (subcategory === QuerySubcategory.INDEX_CREATION) return 'create_index'
        if (subcategory === QuerySubcategory.FUNCTION_CREATION) return 'create_function'
        return 'ddl_operation'
        
      case QueryCategory.DML:
        if (subcategory === QuerySubcategory.DATA_QUERY) return 'data_query'
        if (subcategory === QuerySubcategory.DATA_INSERT) return 'data_insert'
        if (subcategory === QuerySubcategory.DATA_UPDATE) return 'data_update'
        if (subcategory === QuerySubcategory.DATA_DELETE) return 'data_delete'
        return 'data_operation'
        
      case QueryCategory.DCL:
        if (subcategory === QuerySubcategory.RLS_POLICY) return 'rls_policy'
        return 'permission_management'
        
      case QueryCategory.FUNCTION:
        if (subcategory === QuerySubcategory.AGGREGATE_FUNCTION) return 'aggregate_query'
        if (subcategory === QuerySubcategory.WINDOW_FUNCTION) return 'analytics_query'
        return 'function_call'
        
      default:
        return 'general_sql'
    }
  }

  /**
   * Determine if query is safe for AI execution based on classification
   */
  public static isAiExecutable(
    category: QueryCategory, 
    subcategory: QuerySubcategory | null,
    complexity: QueryComplexity
  ): boolean {
    // Block high-risk operations
    if (category === QueryCategory.DCL) return false
    if (category === QueryCategory.UTILITY) return false
    
    // Block dangerous DDL operations
    if (category === QueryCategory.DDL) {
      const safeDDL = [
        QuerySubcategory.TABLE_CREATION,
        QuerySubcategory.INDEX_CREATION
      ]
      if (subcategory && !safeDDL.includes(subcategory)) return false
    }
    
    // Block very complex queries (potential performance impact)
    if (complexity === QueryComplexity.VERY_COMPLEX) return false
    
    // Allow safe operations
    if (category === QueryCategory.DML && subcategory === QuerySubcategory.DATA_QUERY) return true
    if (category === QueryCategory.FUNCTION) return true
    
    return false
  }

  /**
   * Get recommended safety level for AI interaction
   */
  public static getRecommendedSafetyLevel(
    category: QueryCategory,
    subcategory: QuerySubcategory | null
  ): 'allow' | 'review' | 'block' {
    // Always block dangerous operations
    if (category === QueryCategory.UTILITY) return 'block'
    if (category === QueryCategory.DCL) return 'block'
    
    // Review potentially risky operations
    if (category === QueryCategory.DDL) {
      if (subcategory === QuerySubcategory.TABLE_DELETION) return 'block'
      if (subcategory === QuerySubcategory.FUNCTION_DELETION) return 'review'
      return 'review'
    }
    
    if (category === QueryCategory.DML) {
      if (subcategory === QuerySubcategory.DATA_DELETE) return 'review'
      if (subcategory === QuerySubcategory.DATA_UPDATE) return 'review'
      if (subcategory === QuerySubcategory.DATA_QUERY) return 'allow'
      return 'review'
    }
    
    // Allow safe function calls
    if (category === QueryCategory.FUNCTION) {
      if (subcategory === QuerySubcategory.BUILTIN_FUNCTION) return 'allow'
      if (subcategory === QuerySubcategory.AGGREGATE_FUNCTION) return 'allow'
      return 'review'
    }
    
    return 'review'
  }
}