import { describe, it, expect } from 'vitest'
import { analyzeSqlQuery, isQuerySafeForAi, formatSecurityReport } from '../src/index'
import { QueryRiskLevel } from '../src/types/QueryTypes'

describe('Security Analysis', () => {
  describe('Risk Level Assessment', () => {
    it('should classify simple SELECT as low risk', async () => {
      const result = await analyzeSqlQuery('SELECT id, name FROM users WHERE active = true')
      
      expect(result.riskLevel).toBe(QueryRiskLevel.LOW)
      expect(result.aiExecutable).toBe(true)
    })

    it('should classify DELETE without WHERE as high risk', async () => {
      const result = await analyzeSqlQuery('DELETE FROM users')
      
      expect(result.riskLevel).toBe(QueryRiskLevel.HIGH)
      expect(result.aiExecutable).toBe(false)
      expect(result.warnings.some(w => w.message.includes('WHERE clause'))).toBe(true)
    })

    it('should classify DROP TABLE as high risk', async () => {
      const result = await analyzeSqlQuery('DROP TABLE users')
      
      expect(result.riskLevel).toBe(QueryRiskLevel.HIGH)
      expect(result.aiExecutable).toBe(false)
      expect(result.warnings.some(w => w.message.includes('DROP TABLE'))).toBe(true)
    })

    it('should classify dangerous functions as critical risk', async () => {
      const result = await analyzeSqlQuery('SELECT PG_READ_FILE(\'/etc/passwd\')')
      
      expect(result.riskLevel).toBe(QueryRiskLevel.CRITICAL)
      expect(result.aiExecutable).toBe(false)
      expect(result.warnings.some(w => w.level === 'error')).toBe(true)
    })

    it('should classify system catalog access as high risk', async () => {
      const result = await analyzeSqlQuery('SELECT * FROM pg_user')
      
      expect(result.riskLevel).toBe(QueryRiskLevel.HIGH)
      expect(result.warnings.some(w => w.message.includes('system'))).toBe(true)
    })
  })

  describe('Permission Analysis', () => {
    it('should identify SELECT permissions for read queries', async () => {
      const result = await analyzeSqlQuery('SELECT * FROM users JOIN profiles ON users.id = profiles.user_id')
      
      expect(result.requiredPermissions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'SELECT', target: 'users' }),
          expect.objectContaining({ type: 'SELECT', target: 'profiles' })
        ])
      )
    })

    it('should identify INSERT permissions for insert queries', async () => {
      const result = await analyzeSqlQuery('INSERT INTO users (name, email) VALUES (\'John\', \'john@example.com\')')
      
      expect(result.requiredPermissions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'INSERT', target: 'users' })
        ])
      )
    })

    it('should identify UPDATE permissions for update queries', async () => {
      const result = await analyzeSqlQuery('UPDATE users SET last_login = NOW() WHERE id = 1')
      
      expect(result.requiredPermissions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'UPDATE', target: 'users' })
        ])
      )
    })

    it('should identify function execution permissions', async () => {
      const result = await analyzeSqlQuery('SELECT custom_function(id) FROM users')
      
      expect(result.requiredPermissions.some(p => p.type === 'EXECUTE')).toBe(true)
    })
  })

  describe('AI Safety Checks', () => {
    it('should allow safe read-only queries', async () => {
      const safe = await isQuerySafeForAi('SELECT name, email FROM users LIMIT 10')
      expect(safe).toBe(true)
    })

    it('should block dangerous queries', async () => {
      const safe = await isQuerySafeForAi('DROP TABLE users')
      expect(safe).toBe(false)
    })

    it('should block queries in read-only mode that modify data', async () => {
      const safe = await isQuerySafeForAi(
        'INSERT INTO users (name) VALUES (\'John\')',
        { readOnlyMode: true }
      )
      expect(safe).toBe(false)
    })

    it('should respect schema restrictions', async () => {
      const result = await analyzeSqlQuery(
        'SELECT * FROM secret_schema.confidential_data',
        { 
          securityConfig: { 
            allowedSchemas: ['public'] 
          } 
        }
      )
      
      expect(result.warnings.some(w => w.message.includes('schema'))).toBe(true)
    })

    it('should detect blocked functions', async () => {
      const result = await analyzeSqlQuery(
        'SELECT pg_read_file(\'/etc/passwd\')',
        {
          securityConfig: {
            blockedFunctions: ['PG_READ_FILE']
          }
        }
      )
      
      expect(result.riskLevel).toBe(QueryRiskLevel.CRITICAL)
      expect(result.aiExecutable).toBe(false)
    })
  })

  describe('Performance Impact Analysis', () => {
    it('should identify performance factors', async () => {
      const result = await analyzeSqlQuery(`
        WITH RECURSIVE hierarchy AS (
          SELECT id, name, parent_id, 1 as level FROM categories WHERE parent_id IS NULL
          UNION ALL
          SELECT c.id, c.name, c.parent_id, h.level + 1
          FROM categories c
          JOIN hierarchy h ON c.parent_id = h.id
        )
        SELECT * FROM hierarchy
        JOIN products ON hierarchy.id = products.category_id
        ORDER BY level, name
      `)
      
      expect(result.performance.complexityScore).toBeGreaterThan(50)
      expect(result.performance.factors.length).toBeGreaterThan(0)
      expect(result.performance.timeCategory).toMatch(/moderate|slow|very_slow/)
    })

    it('should suggest optimizations for SELECT *', async () => {
      const result = await analyzeSqlQuery('SELECT * FROM large_table')
      
      expect(result.performance.optimizations).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Select only needed columns')
        ])
      )
    })

    it('should warn about missing WHERE clauses', async () => {
      const result = await analyzeSqlQuery('UPDATE users SET last_login = NOW()')
      
      expect(result.performance.factors).toEqual(
        expect.arrayContaining([
          expect.stringContaining('WHERE clause')
        ])
      )
    })
  })

  describe('Security Configuration', () => {
    it('should respect read-only mode', async () => {
      const result = await analyzeSqlQuery(
        'UPDATE users SET name = \'Jane\'',
        { readOnlyMode: true }
      )
      
      expect(result.aiExecutable).toBe(false)
      expect(result.warnings.some(w => w.message.includes('read-only'))).toBe(true)
    })

    it('should use custom security rules', async () => {
      const result = await analyzeSqlQuery(
        'SELECT * FROM users',
        {
          securityConfig: {
            customRules: [{
              id: 'test-rule',
              name: 'Test Rule',
              description: 'Test custom rule',
              pattern: '\\*',
              action: 'warn',
              riskLevel: QueryRiskLevel.MEDIUM,
              message: 'Custom rule triggered'
            }]
          }
        }
      )
      
      expect(result.warnings.some(w => w.message.includes('Custom rule'))).toBe(true)
    })
  })

  describe('Complex Query Analysis', () => {
    it('should handle queries with multiple tables and functions', async () => {
      const result = await analyzeSqlQuery(`
        SELECT 
          u.name,
          COUNT(o.id) as order_count,
          SUM(o.total) as total_spent,
          RANK() OVER (ORDER BY SUM(o.total) DESC) as spending_rank
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE u.created_at > NOW() - INTERVAL '1 year'
        GROUP BY u.id, u.name
        HAVING COUNT(o.id) > 0
        ORDER BY total_spent DESC
        LIMIT 100
      `)
      
      expect(result.query.tables.length).toBeGreaterThan(2)
      expect(result.query.functions.length).toBeGreaterThan(2)
      expect(result.performance.complexityScore).toBeGreaterThan(30)
    })

    it('should analyze CTE queries properly', async () => {
      const result = await analyzeSqlQuery(`
        WITH monthly_revenue AS (
          SELECT 
            DATE_TRUNC('month', created_at) as month,
            SUM(total) as revenue
          FROM orders
          WHERE created_at >= '2023-01-01'
          GROUP BY DATE_TRUNC('month', created_at)
        ),
        growth_rates AS (
          SELECT 
            month,
            revenue,
            LAG(revenue) OVER (ORDER BY month) as prev_revenue,
            CASE 
              WHEN LAG(revenue) OVER (ORDER BY month) IS NOT NULL
              THEN (revenue - LAG(revenue) OVER (ORDER BY month)) / LAG(revenue) OVER (ORDER BY month) * 100
              ELSE NULL
            END as growth_rate
          FROM monthly_revenue
        )
        SELECT * FROM growth_rates ORDER BY month
      `)
      
      expect(result.query.hasCTEs).toBe(true)
      expect(result.query.hasWindowFunctions).toBe(true)
      expect(result.complexity).toMatch(/complex|very_complex/)
    })
  })

  describe('Report Formatting', () => {
    it('should format security report properly', async () => {
      const result = await analyzeSqlQuery('SELECT * FROM users WHERE id = 1')
      const report = formatSecurityReport(result)
      
      expect(report).toContain('SQL Security Analysis Report')
      expect(report).toContain('Risk Level:')
      expect(report).toContain('AI Executable:')
      expect(report).toContain('Performance:')
    })

    it('should include warnings in formatted report', async () => {
      const result = await analyzeSqlQuery('DELETE FROM users')
      const report = formatSecurityReport(result)
      
      expect(report).toContain('Warnings:')
      expect(report).toContain('[ERROR]')
    })

    it('should include permissions in formatted report', async () => {
      const result = await analyzeSqlQuery('SELECT * FROM users')
      const report = formatSecurityReport(result)
      
      expect(report).toContain('Required Permissions:')
      expect(report).toContain('SELECT on')
    })
  })
})