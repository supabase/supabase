import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ForeignKeyConstraint } from 'data/database/foreign-key-constraints-query'

// Mock generateSqlPolicy for AI tests
const mockGenerateSqlPolicy = vi.fn()
vi.mock('data/ai/sql-policy-mutation', () => ({
  generateSqlPolicy: (...args: unknown[]) => mockGenerateSqlPolicy(...args),
}))

// Import after mocks are set up
import {
  generateAiPoliciesForTable,
  generateProgrammaticPoliciesForTable,
  generateStartingPoliciesForTable,
  type GeneratedPolicy,
} from './Policies.utils'

// Helper to create a foreign key constraint
const createForeignKey = (overrides: Partial<ForeignKeyConstraint> = {}): ForeignKeyConstraint => ({
  id: 1,
  constraint_name: 'fk_constraint',
  source_id: 100,
  source_schema: 'public',
  source_table: 'posts',
  source_columns: ['user_id'],
  target_id: 200,
  target_schema: 'auth',
  target_table: 'users',
  target_columns: ['id'],
  deletion_action: 'NO ACTION',
  update_action: 'NO ACTION',
  ...overrides,
})

describe('Policies.utils - Policy Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateProgrammaticPoliciesForTable', () => {
    it('should generate 4 CRUD policies for direct FK to auth.users', () => {
      const foreignKeyConstraints: ForeignKeyConstraint[] = [
        createForeignKey({
          source_schema: 'public',
          source_table: 'posts',
          source_columns: ['user_id'],
          target_schema: 'auth',
          target_table: 'users',
          target_columns: ['id'],
        }),
      ]

      const policies = generateProgrammaticPoliciesForTable({
        table: { name: 'posts', schema: 'public' },
        foreignKeyConstraints,
      })

      expect(policies).toHaveLength(4)

      const commands = policies.map((p) => p.command)
      expect(commands).toContain('SELECT')
      expect(commands).toContain('INSERT')
      expect(commands).toContain('UPDATE')
      expect(commands).toContain('DELETE')
    })

    it('should return empty array when no FK path to auth.users exists', () => {
      const foreignKeyConstraints: ForeignKeyConstraint[] = [
        createForeignKey({
          source_schema: 'public',
          source_table: 'posts',
          source_columns: ['category_id'],
          target_schema: 'public',
          target_table: 'categories',
          target_columns: ['id'],
        }),
      ]

      const policies = generateProgrammaticPoliciesForTable({
        table: { name: 'posts', schema: 'public' },
        foreignKeyConstraints,
      })

      expect(policies).toHaveLength(0)
    })

    it('should return empty array when foreignKeyConstraints is empty', () => {
      const policies = generateProgrammaticPoliciesForTable({
        table: { name: 'posts', schema: 'public' },
        foreignKeyConstraints: [],
      })

      expect(policies).toHaveLength(0)
    })

    it('should generate policies with EXISTS clause for indirect FK path (2 hops)', () => {
      // posts -> profiles -> auth.users
      const foreignKeyConstraints: ForeignKeyConstraint[] = [
        createForeignKey({
          id: 1,
          source_schema: 'public',
          source_table: 'posts',
          source_columns: ['profile_id'],
          target_schema: 'public',
          target_table: 'profiles',
          target_columns: ['id'],
        }),
        createForeignKey({
          id: 2,
          source_schema: 'public',
          source_table: 'profiles',
          source_columns: ['user_id'],
          target_schema: 'auth',
          target_table: 'users',
          target_columns: ['id'],
        }),
      ]

      const policies = generateProgrammaticPoliciesForTable({
        table: { name: 'posts', schema: 'public' },
        foreignKeyConstraints,
      })

      expect(policies).toHaveLength(4)

      // Check that the expression contains EXISTS for indirect path
      const selectPolicy = policies.find((p) => p.command === 'SELECT')
      expect(selectPolicy?.definition).toContain('exists')
      expect(selectPolicy?.sql).toContain('exists')
    })

    describe('policy structure validation', () => {
      const foreignKeyConstraints: ForeignKeyConstraint[] = [
        createForeignKey({
          source_schema: 'public',
          source_table: 'posts',
          source_columns: ['user_id'],
          target_schema: 'auth',
          target_table: 'users',
          target_columns: ['id'],
        }),
      ]

      it('should include all required fields in generated policies', () => {
        const policies = generateProgrammaticPoliciesForTable({
          table: { name: 'posts', schema: 'public' },
          foreignKeyConstraints,
        })

        for (const policy of policies) {
          expect(policy).toHaveProperty('name')
          expect(policy).toHaveProperty('sql')
          expect(policy).toHaveProperty('command')
          expect(policy).toHaveProperty('table', 'posts')
          expect(policy).toHaveProperty('schema', 'public')
          expect(policy).toHaveProperty('action', 'PERMISSIVE')
          expect(policy).toHaveProperty('roles')
          expect(policy.roles).toContain('public')
        }
      })

      it('SELECT policy should have definition but no check', () => {
        const policies = generateProgrammaticPoliciesForTable({
          table: { name: 'posts', schema: 'public' },
          foreignKeyConstraints,
        })

        const selectPolicy = policies.find((p) => p.command === 'SELECT')
        expect(selectPolicy?.definition).toBeDefined()
        expect(selectPolicy?.check).toBeUndefined()
      })

      it('DELETE policy should have definition but no check', () => {
        const policies = generateProgrammaticPoliciesForTable({
          table: { name: 'posts', schema: 'public' },
          foreignKeyConstraints,
        })

        const deletePolicy = policies.find((p) => p.command === 'DELETE')
        expect(deletePolicy?.definition).toBeDefined()
        expect(deletePolicy?.check).toBeUndefined()
      })

      it('INSERT policy should have check but no definition', () => {
        const policies = generateProgrammaticPoliciesForTable({
          table: { name: 'posts', schema: 'public' },
          foreignKeyConstraints,
        })

        const insertPolicy = policies.find((p) => p.command === 'INSERT')
        expect(insertPolicy?.definition).toBeUndefined()
        expect(insertPolicy?.check).toBeDefined()
      })

      it('UPDATE policy should have both definition and check', () => {
        const policies = generateProgrammaticPoliciesForTable({
          table: { name: 'posts', schema: 'public' },
          foreignKeyConstraints,
        })

        const updatePolicy = policies.find((p) => p.command === 'UPDATE')
        expect(updatePolicy?.definition).toBeDefined()
        expect(updatePolicy?.check).toBeDefined()
      })

      it('should generate correct SQL syntax for direct FK', () => {
        const policies = generateProgrammaticPoliciesForTable({
          table: { name: 'posts', schema: 'public' },
          foreignKeyConstraints,
        })

        const selectPolicy = policies.find((p) => p.command === 'SELECT')
        expect(selectPolicy?.sql).toContain('CREATE POLICY')
        expect(selectPolicy?.sql).toContain('public.posts')
        expect(selectPolicy?.sql).toContain('AS PERMISSIVE FOR SELECT')
        expect(selectPolicy?.sql).toContain('TO public')
        expect(selectPolicy?.sql).toContain('USING')
        expect(selectPolicy?.sql).toContain('auth.uid()')
      })
    })

    it('should handle non-public schema', () => {
      const foreignKeyConstraints: ForeignKeyConstraint[] = [
        createForeignKey({
          source_schema: 'private',
          source_table: 'documents',
          source_columns: ['owner_id'],
          target_schema: 'auth',
          target_table: 'users',
          target_columns: ['id'],
        }),
      ]

      const policies = generateProgrammaticPoliciesForTable({
        table: { name: 'documents', schema: 'private' },
        foreignKeyConstraints,
      })

      expect(policies).toHaveLength(4)
      expect(policies[0].schema).toBe('private')
      expect(policies[0].sql).toContain('private.documents')
    })
  })

  describe('generateAiPoliciesForTable', () => {
    const mockAiPolicies: GeneratedPolicy[] = [
      {
        name: 'ai_select_policy',
        sql: 'CREATE POLICY "ai_select_policy" ON public.posts FOR SELECT USING (true);',
        command: 'SELECT',
        table: 'posts',
        schema: 'public',
        definition: 'true',
        action: 'PERMISSIVE',
        roles: ['public'],
      },
    ]

    it('should return policies from AI when called with valid inputs', async () => {
      mockGenerateSqlPolicy.mockResolvedValue(mockAiPolicies)

      const policies = await generateAiPoliciesForTable({
        table: { name: 'posts', schema: 'public' },
        columns: [{ name: 'id' }, { name: 'title' }],
        projectRef: 'test-project',
        connectionString: 'postgresql://localhost:5432/test',
      })

      expect(mockGenerateSqlPolicy).toHaveBeenCalledWith({
        tableName: 'posts',
        schema: 'public',
        columns: ['id', 'title'],
        projectRef: 'test-project',
        connectionString: 'postgresql://localhost:5432/test',
      })
      expect(policies).toEqual(mockAiPolicies)
    })

    it('should return empty array when connectionString is null', async () => {
      const policies = await generateAiPoliciesForTable({
        table: { name: 'posts', schema: 'public' },
        columns: [{ name: 'id' }],
        projectRef: 'test-project',
        connectionString: null,
      })

      expect(mockGenerateSqlPolicy).not.toHaveBeenCalled()
      expect(policies).toEqual([])
    })

    it('should return empty array when connectionString is undefined', async () => {
      const policies = await generateAiPoliciesForTable({
        table: { name: 'posts', schema: 'public' },
        columns: [{ name: 'id' }],
        projectRef: 'test-project',
        connectionString: undefined,
      })

      expect(mockGenerateSqlPolicy).not.toHaveBeenCalled()
      expect(policies).toEqual([])
    })

    it('should handle API errors gracefully and return empty array', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      mockGenerateSqlPolicy.mockRejectedValue(new Error('API error'))

      const policies = await generateAiPoliciesForTable({
        table: { name: 'posts', schema: 'public' },
        columns: [{ name: 'id' }],
        projectRef: 'test-project',
        connectionString: 'postgresql://localhost:5432/test',
      })

      expect(policies).toEqual([])
      expect(consoleLogSpy).toHaveBeenCalledWith('AI policy generation failed:', expect.any(Error))

      consoleLogSpy.mockRestore()
    })

    it('should trim column names before sending to API', async () => {
      mockGenerateSqlPolicy.mockResolvedValue([])

      await generateAiPoliciesForTable({
        table: { name: 'posts', schema: 'public' },
        columns: [{ name: '  id  ' }, { name: ' title ' }],
        projectRef: 'test-project',
        connectionString: 'postgresql://localhost:5432/test',
      })

      expect(mockGenerateSqlPolicy).toHaveBeenCalledWith(
        expect.objectContaining({
          columns: ['id', 'title'],
        })
      )
    })
  })

  describe('generateStartingPoliciesForTable', () => {
    const mockAiPolicies: GeneratedPolicy[] = [
      {
        name: 'ai_policy',
        sql: 'CREATE POLICY "ai_policy" ON public.posts FOR SELECT USING (true);',
        command: 'SELECT',
        table: 'posts',
        schema: 'public',
        definition: 'true',
        action: 'PERMISSIVE',
        roles: ['public'],
      },
    ]

    it('should use programmatic policies when FK path exists (does not call AI)', async () => {
      const foreignKeyConstraints: ForeignKeyConstraint[] = [
        createForeignKey({
          source_schema: 'public',
          source_table: 'posts',
          source_columns: ['user_id'],
          target_schema: 'auth',
          target_table: 'users',
          target_columns: ['id'],
        }),
      ]

      const policies = await generateStartingPoliciesForTable({
        table: { name: 'posts', schema: 'public' },
        foreignKeyConstraints,
        columns: [{ name: 'id' }],
        projectRef: 'test-project',
        connectionString: 'postgresql://localhost:5432/test',
        enableAi: true,
      })

      expect(policies).toHaveLength(4)
      expect(mockGenerateSqlPolicy).not.toHaveBeenCalled()
    })

    it('should fall back to AI when no FK path exists and enableAi is true', async () => {
      mockGenerateSqlPolicy.mockResolvedValue(mockAiPolicies)

      const policies = await generateStartingPoliciesForTable({
        table: { name: 'posts', schema: 'public' },
        foreignKeyConstraints: [],
        columns: [{ name: 'id' }],
        projectRef: 'test-project',
        connectionString: 'postgresql://localhost:5432/test',
        enableAi: true,
      })

      expect(mockGenerateSqlPolicy).toHaveBeenCalled()
      expect(policies).toEqual(mockAiPolicies)
    })

    it('should return empty array when no FK path exists and enableAi is false', async () => {
      const policies = await generateStartingPoliciesForTable({
        table: { name: 'posts', schema: 'public' },
        foreignKeyConstraints: [],
        columns: [{ name: 'id' }],
        projectRef: 'test-project',
        connectionString: 'postgresql://localhost:5432/test',
        enableAi: false,
      })

      expect(mockGenerateSqlPolicy).not.toHaveBeenCalled()
      expect(policies).toEqual([])
    })

    it('should return empty array when no FK path and AI returns empty', async () => {
      mockGenerateSqlPolicy.mockResolvedValue([])

      const policies = await generateStartingPoliciesForTable({
        table: { name: 'posts', schema: 'public' },
        foreignKeyConstraints: [],
        columns: [{ name: 'id' }],
        projectRef: 'test-project',
        connectionString: 'postgresql://localhost:5432/test',
        enableAi: true,
      })

      expect(policies).toEqual([])
    })

    it('should prioritize programmatic over AI even when both could generate policies', async () => {
      mockGenerateSqlPolicy.mockResolvedValue(mockAiPolicies)

      const foreignKeyConstraints: ForeignKeyConstraint[] = [
        createForeignKey({
          source_schema: 'public',
          source_table: 'posts',
          source_columns: ['user_id'],
          target_schema: 'auth',
          target_table: 'users',
          target_columns: ['id'],
        }),
      ]

      const policies = await generateStartingPoliciesForTable({
        table: { name: 'posts', schema: 'public' },
        foreignKeyConstraints,
        columns: [{ name: 'id' }],
        projectRef: 'test-project',
        connectionString: 'postgresql://localhost:5432/test',
        enableAi: true,
      })

      // Should return 4 programmatic policies, not 1 AI policy
      expect(policies).toHaveLength(4)
      expect(mockGenerateSqlPolicy).not.toHaveBeenCalled()
    })
  })
})
