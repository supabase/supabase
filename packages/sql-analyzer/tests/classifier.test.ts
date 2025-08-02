import { describe, it, expect } from 'vitest'
import { QueryClassifier } from '../src/parser/QueryClassifier'
import { QueryCategory, QuerySubcategory, QueryComplexity } from '../src/types/QueryTypes'

describe('QueryClassifier', () => {
  describe('Category Classification', () => {
    it('should classify SELECT as DML', () => {
      const result = QueryClassifier.classify('SELECT * FROM users')
      
      expect(result.category).toBe(QueryCategory.DML)
      expect(result.subcategory).toBe(QuerySubcategory.DATA_QUERY)
    })

    it('should classify INSERT as DML', () => {
      const result = QueryClassifier.classify('INSERT INTO users (name) VALUES (\'John\')')
      
      expect(result.category).toBe(QueryCategory.DML)
      expect(result.subcategory).toBe(QuerySubcategory.DATA_INSERT)
    })

    it('should classify UPDATE as DML', () => {
      const result = QueryClassifier.classify('UPDATE users SET name = \'Jane\' WHERE id = 1')
      
      expect(result.category).toBe(QueryCategory.DML)
      expect(result.subcategory).toBe(QuerySubcategory.DATA_UPDATE)
    })

    it('should classify DELETE as DML', () => {
      const result = QueryClassifier.classify('DELETE FROM users WHERE id = 1')
      
      expect(result.category).toBe(QueryCategory.DML)
      expect(result.subcategory).toBe(QuerySubcategory.DATA_DELETE)
    })

    it('should classify CREATE TABLE as DDL', () => {
      const result = QueryClassifier.classify('CREATE TABLE users (id serial primary key)')
      
      expect(result.category).toBe(QueryCategory.DDL)
      expect(result.subcategory).toBe(QuerySubcategory.TABLE_CREATION)
    })

    it('should classify ALTER TABLE as DDL', () => {
      const result = QueryClassifier.classify('ALTER TABLE users ADD COLUMN email text')
      
      expect(result.category).toBe(QueryCategory.DDL)
      expect(result.subcategory).toBe(QuerySubcategory.TABLE_ALTERATION)
    })

    it('should classify DROP TABLE as DDL', () => {
      const result = QueryClassifier.classify('DROP TABLE users')
      
      expect(result.category).toBe(QueryCategory.DDL)
      expect(result.subcategory).toBe(QuerySubcategory.TABLE_DELETION)
    })

    it('should classify CREATE INDEX as DDL', () => {
      const result = QueryClassifier.classify('CREATE INDEX idx_users_email ON users(email)')
      
      expect(result.category).toBe(QueryCategory.DDL)
      expect(result.subcategory).toBe(QuerySubcategory.INDEX_CREATION)
    })

    it('should classify GRANT as DCL', () => {
      const result = QueryClassifier.classify('GRANT SELECT ON users TO public')
      
      expect(result.category).toBe(QueryCategory.DCL)
      expect(result.subcategory).toBe(QuerySubcategory.PERMISSION_GRANT)
    })

    it('should classify REVOKE as DCL', () => {
      const result = QueryClassifier.classify('REVOKE SELECT ON users FROM public')
      
      expect(result.category).toBe(QueryCategory.DCL)
      expect(result.subcategory).toBe(QuerySubcategory.PERMISSION_REVOKE)
    })
  })

  describe('Function Classification', () => {
    it('should classify aggregate functions', () => {
      const result = QueryClassifier.classify('SELECT COUNT(*), SUM(amount) FROM orders')
      
      expect(result.category).toBe(QueryCategory.DML)
      expect(result.subcategory).toBe(QuerySubcategory.DATA_QUERY)
      expect(result.parsedQuery.functions).toContain('COUNT')
      expect(result.parsedQuery.functions).toContain('SUM')
    })

    it('should classify window functions', () => {
      const result = QueryClassifier.classify('SELECT name, ROW_NUMBER() OVER (ORDER BY created_at) FROM users')
      
      expect(result.parsedQuery.functions).toContain('ROW_NUMBER')
      expect(result.parsedQuery.hasWindowFunctions).toBe(true)
    })

    it('should classify built-in string functions', () => {
      const result = QueryClassifier.classify('SELECT UPPER(name), LENGTH(email) FROM users')
      
      expect(result.parsedQuery.functions).toContain('UPPER')
      expect(result.parsedQuery.functions).toContain('LENGTH')
    })
  })

  describe('Complexity Assessment', () => {
    it('should classify simple queries', () => {
      const result = QueryClassifier.classify('SELECT id, name FROM users WHERE active = true')
      
      expect(result.complexity).toBe(QueryComplexity.SIMPLE)
    })

    it('should classify moderate complexity queries', () => {
      const result = QueryClassifier.classify(`
        SELECT u.name, COUNT(o.id) as order_count
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        GROUP BY u.name
        HAVING COUNT(o.id) > 5
      `)
      
      expect([QueryComplexity.MODERATE, QueryComplexity.COMPLEX]).toContain(result.complexity)
    })

    it('should classify complex queries with CTEs', () => {
      const result = QueryClassifier.classify(`
        WITH monthly_sales AS (
          SELECT 
            DATE_TRUNC('month', created_at) as month,
            SUM(amount) as total
          FROM orders
          GROUP BY DATE_TRUNC('month', created_at)
        ),
        user_totals AS (
          SELECT user_id, SUM(amount) as user_total
          FROM orders
          GROUP BY user_id
        )
        SELECT ms.month, ms.total, AVG(ut.user_total)
        FROM monthly_sales ms
        CROSS JOIN user_totals ut
        GROUP BY ms.month, ms.total
        ORDER BY ms.month
      `)
      
      expect([QueryComplexity.COMPLEX, QueryComplexity.VERY_COMPLEX]).toContain(result.complexity)
    })
  })

  describe('AI Prompt Type Generation', () => {
    it('should generate correct prompt type for data queries', () => {
      const promptType = QueryClassifier.getAiPromptType(
        QueryCategory.DML, 
        QuerySubcategory.DATA_QUERY
      )
      
      expect(promptType).toBe('data_query')
    })

    it('should generate correct prompt type for table creation', () => {
      const promptType = QueryClassifier.getAiPromptType(
        QueryCategory.DDL, 
        QuerySubcategory.TABLE_CREATION
      )
      
      expect(promptType).toBe('create_table')
    })

    it('should generate correct prompt type for aggregate functions', () => {
      const promptType = QueryClassifier.getAiPromptType(
        QueryCategory.FUNCTION, 
        QuerySubcategory.AGGREGATE_FUNCTION
      )
      
      expect(promptType).toBe('aggregate_query')
    })

    it('should generate correct prompt type for RLS policies', () => {
      const promptType = QueryClassifier.getAiPromptType(
        QueryCategory.DCL, 
        QuerySubcategory.RLS_POLICY
      )
      
      expect(promptType).toBe('rls_policy')
    })
  })

  describe('AI Executability Assessment', () => {
    it('should allow safe read queries', () => {
      const isExecutable = QueryClassifier.isAiExecutable(
        QueryCategory.DML,
        QuerySubcategory.DATA_QUERY,
        QueryComplexity.SIMPLE
      )
      
      expect(isExecutable).toBe(true)
    })

    it('should block DCL operations', () => {
      const isExecutable = QueryClassifier.isAiExecutable(
        QueryCategory.DCL,
        QuerySubcategory.PERMISSION_GRANT,
        QueryComplexity.SIMPLE
      )
      
      expect(isExecutable).toBe(false)
    })

    it('should block utility operations', () => {
      const isExecutable = QueryClassifier.isAiExecutable(
        QueryCategory.UTILITY,
        null,
        QueryComplexity.SIMPLE
      )
      
      expect(isExecutable).toBe(false)
    })

    it('should block very complex queries', () => {
      const isExecutable = QueryClassifier.isAiExecutable(
        QueryCategory.DML,
        QuerySubcategory.DATA_QUERY,
        QueryComplexity.VERY_COMPLEX
      )
      
      expect(isExecutable).toBe(false)
    })
  })

  describe('Safety Level Recommendations', () => {
    it('should recommend allowing safe read queries', () => {
      const safetyLevel = QueryClassifier.getRecommendedSafetyLevel(
        QueryCategory.DML,
        QuerySubcategory.DATA_QUERY
      )
      
      expect(safetyLevel).toBe('allow')
    })

    it('should recommend reviewing data modifications', () => {
      const safetyLevel = QueryClassifier.getRecommendedSafetyLevel(
        QueryCategory.DML,
        QuerySubcategory.DATA_UPDATE
      )
      
      expect(safetyLevel).toBe('review')
    })

    it('should recommend blocking dangerous DDL operations', () => {
      const safetyLevel = QueryClassifier.getRecommendedSafetyLevel(
        QueryCategory.DDL,
        QuerySubcategory.TABLE_DELETION
      )
      
      expect(safetyLevel).toBe('block')
    })

    it('should recommend blocking all DCL operations', () => {
      const safetyLevel = QueryClassifier.getRecommendedSafetyLevel(
        QueryCategory.DCL,
        QuerySubcategory.PERMISSION_GRANT
      )
      
      expect(safetyLevel).toBe('block')
    })

    it('should recommend blocking all utility operations', () => {
      const safetyLevel = QueryClassifier.getRecommendedSafetyLevel(
        QueryCategory.UTILITY,
        null
      )
      
      expect(safetyLevel).toBe('block')
    })
  })

  describe('Edge Cases', () => {
    it('should handle malformed SQL gracefully', () => {
      const result = QueryClassifier.classify('SELET * FORM users')
      
      expect(result.category).toBe(QueryCategory.UNKNOWN)
    })

    it('should handle empty queries', () => {
      const result = QueryClassifier.classify('')
      
      expect(result.category).toBe(QueryCategory.UNKNOWN)
      expect(result.complexity).toBe(QueryComplexity.SIMPLE)
    })

    it('should handle SQL with comments', () => {
      const result = QueryClassifier.classify(`
        -- Get all active users
        SELECT * FROM users 
        WHERE active = true -- Only active ones
      `)
      
      expect(result.category).toBe(QueryCategory.DML)
      expect(result.subcategory).toBe(QuerySubcategory.DATA_QUERY)
    })

    it('should handle case-insensitive keywords', () => {
      const result = QueryClassifier.classify('select * from users')
      
      expect(result.category).toBe(QueryCategory.DML)
      expect(result.subcategory).toBe(QuerySubcategory.DATA_QUERY)
    })
  })
})