import { describe, it, expect } from 'vitest'
import { SqlParser } from '../src/parser/SqlParser'
import { QueryComplexity } from '../src/types/QueryTypes'

describe('SqlParser', () => {
  describe('Basic Parsing', () => {
    it('should parse simple SELECT query', () => {
      const parser = new SqlParser('SELECT * FROM users')
      const result = parser.parse()
      
      expect(result.operation).toBe('SELECT')
      expect(result.tables).toContain('users')
      expect(result.isReadOnly).toBe(true)
      expect(result.isModifying).toBe(false)
    })

    it('should parse INSERT query', () => {
      const parser = new SqlParser('INSERT INTO users (name, email) VALUES (\'John\', \'john@example.com\')')
      const result = parser.parse()
      
      expect(result.operation).toBe('INSERT')
      expect(result.tables).toContain('users')
      expect(result.isReadOnly).toBe(false)
      expect(result.isModifying).toBe(true)
    })

    it('should parse UPDATE query', () => {
      const parser = new SqlParser('UPDATE users SET name = \'Jane\' WHERE id = 1')
      const result = parser.parse()
      
      expect(result.operation).toBe('UPDATE')
      expect(result.tables).toContain('users')
      expect(result.isReadOnly).toBe(false)
      expect(result.isModifying).toBe(true)
    })

    it('should parse DELETE query', () => {
      const parser = new SqlParser('DELETE FROM users WHERE id = 1')
      const result = parser.parse()
      
      expect(result.operation).toBe('DELETE')
      expect(result.tables).toContain('users')
      expect(result.isReadOnly).toBe(false)
      expect(result.isModifying).toBe(true)
    })
  })

  describe('Complex Query Features', () => {
    it('should detect subqueries', () => {
      const parser = new SqlParser('SELECT * FROM users WHERE id IN (SELECT user_id FROM orders)')
      const result = parser.parse()
      
      expect(result.hasSubqueries).toBe(true)
      expect(result.tables).toEqual(expect.arrayContaining(['users', 'orders']))
    })

    it('should detect CTEs', () => {
      const parser = new SqlParser('WITH active_users AS (SELECT * FROM users WHERE active = true) SELECT * FROM active_users')
      const result = parser.parse()
      
      expect(result.hasCTEs).toBe(true)
    })

    it('should detect window functions', () => {
      const parser = new SqlParser('SELECT name, ROW_NUMBER() OVER (ORDER BY created_at) FROM users')
      const result = parser.parse()
      
      expect(result.hasWindowFunctions).toBe(true)
      expect(result.functions).toContain('ROW_NUMBER')
    })

    it('should detect JOINs', () => {
      const parser = new SqlParser('SELECT u.name, p.title FROM users u JOIN posts p ON u.id = p.user_id')
      const result = parser.parse()
      
      expect(result.tables).toEqual(expect.arrayContaining(['users', 'posts']))
    })
  })

  describe('Function Extraction', () => {
    it('should extract function calls', () => {
      const parser = new SqlParser('SELECT COUNT(*), MAX(created_at), LOWER(name) FROM users')
      const result = parser.parse()
      
      expect(result.functions).toEqual(expect.arrayContaining(['COUNT', 'MAX', 'LOWER']))
    })

    it('should handle nested function calls', () => {
      const parser = new SqlParser('SELECT LENGTH(TRIM(name)) FROM users')
      const result = parser.parse()
      
      expect(result.functions).toEqual(expect.arrayContaining(['LENGTH', 'TRIM']))
    })
  })

  describe('Schema Extraction', () => {
    it('should extract explicit schema references', () => {
      const parser = new SqlParser('SELECT * FROM public.users JOIN auth.profiles ON users.id = profiles.user_id')
      const result = parser.parse()
      
      expect(result.schemas).toEqual(expect.arrayContaining(['public', 'auth']))
    })

    it('should default to public schema when none specified', () => {
      const parser = new SqlParser('SELECT * FROM users')
      const result = parser.parse()
      
      expect(result.schemas).toContain('public')
    })
  })

  describe('Complexity Calculation', () => {
    it('should classify simple queries', () => {
      const parser = new SqlParser('SELECT * FROM users WHERE id = 1')
      const complexity = parser.calculateComplexity()
      
      expect(complexity).toBe(QueryComplexity.SIMPLE)
    })

    it('should classify moderate complexity queries', () => {
      const parser = new SqlParser('SELECT u.name, COUNT(p.id) FROM users u LEFT JOIN posts p ON u.id = p.user_id GROUP BY u.name')
      const complexity = parser.calculateComplexity()
      
      expect(complexity).toBe(QueryComplexity.MODERATE)
    })

    it('should classify complex queries', () => {
      const parser = new SqlParser(`
        WITH user_stats AS (
          SELECT user_id, COUNT(*) as post_count
          FROM posts 
          GROUP BY user_id
        )
        SELECT u.name, us.post_count, ROW_NUMBER() OVER (ORDER BY us.post_count DESC)
        FROM users u 
        JOIN user_stats us ON u.id = us.user_id
        WHERE us.post_count > 5
      `)
      const complexity = parser.calculateComplexity()
      
      expect([QueryComplexity.COMPLEX, QueryComplexity.VERY_COMPLEX]).toContain(complexity)
    })
  })

  describe('DDL Operations', () => {
    it('should parse CREATE TABLE', () => {
      const parser = new SqlParser('CREATE TABLE users (id serial primary key, name text)')
      const result = parser.parse()
      
      expect(result.operation).toBe('CREATE TABLE')
      expect(result.isModifying).toBe(true)
    })

    it('should parse ALTER TABLE', () => {
      const parser = new SqlParser('ALTER TABLE users ADD COLUMN email text')
      const result = parser.parse()
      
      expect(result.operation).toBe('ALTER TABLE')
      expect(result.tables).toContain('users')
    })

    it('should parse DROP TABLE', () => {
      const parser = new SqlParser('DROP TABLE IF EXISTS temp_users')
      const result = parser.parse()
      
      expect(result.operation).toBe('DROP TABLE')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty or whitespace-only queries', () => {
      const parser = new SqlParser('   ')
      const result = parser.parse()
      
      expect(result.operation).toBe('UNKNOWN')
      expect(result.tables).toHaveLength(0)
    })

    it('should handle queries with comments', () => {
      const parser = new SqlParser('-- This is a comment\\nSELECT * FROM users -- Another comment')
      const result = parser.parse()
      
      expect(result.operation).toBe('SELECT')
      expect(result.tables).toContain('users')
    })

    it('should handle case insensitive keywords', () => {
      const parser = new SqlParser('select * from Users where ID = 1')
      const result = parser.parse()
      
      expect(result.operation).toBe('select')
      expect(result.tables).toContain('Users')
      expect(result.isReadOnly).toBe(true)
    })

    it('should handle quoted identifiers', () => {
      const parser = new SqlParser('SELECT * FROM "users with spaces" WHERE "user id" = 1')
      const result = parser.parse()
      
      expect(result.tables).toContain('users with spaces')
    })
  })

  describe('Normalization', () => {
    it('should normalize whitespace', () => {
      const parser = new SqlParser('SELECT   *    FROM     users   WHERE  id = 1')
      const result = parser.parse()
      
      expect(result.normalizedSql).not.toContain('  ') // No double spaces
    })

    it('should preserve essential formatting', () => {
      const parser = new SqlParser('SELECT name, email FROM users')
      const result = parser.parse()
      
      expect(result.normalizedSql).toContain('name,email') // Comma formatting
    })
  })
})