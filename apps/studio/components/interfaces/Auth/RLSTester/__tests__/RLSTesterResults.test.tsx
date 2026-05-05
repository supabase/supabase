import type { SafeSqlFragment } from '@supabase/pg-meta'
import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { Policy } from '@/components/interfaces/Auth/Policies/PolicyTableRow/PolicyTableRow.utils'
import type { ParseQueryResults } from '@/components/interfaces/Auth/RLSTester/RLSTester.types'
import { RLSTesterResults } from '@/components/interfaces/Auth/RLSTester/RLSTesterResults'
import { render } from '@/tests/helpers'

vi.mock('@/components/interfaces/Auth/RLSTester/useTestQueryRLS', () => ({
  useTestQueryRLS: () => ({ limit: 100 }),
}))

vi.mock('@/components/interfaces/Auth/RLSTester/RLSTableCard', () => ({
  RLSTableCard: () => <div data-testid="rls-table-card" />,
}))

vi.mock('@/components/interfaces/SQLEditor/UtilityPanel/Results', () => ({
  Results: () => <div data-testid="results" />,
}))

const sql = (s: string) => s as unknown as SafeSqlFragment

const makePolicy = (definition: string | null = null): Policy =>
  ({ definition: definition !== null ? sql(definition) : null }) as Policy

const makeTable = (
  overrides?: Partial<ParseQueryResults['tables'][number]>
): ParseQueryResults['tables'][number] => ({
  schema: 'public',
  table: 'items',
  isRLSEnabled: true,
  tablePolicies: [],
  ...overrides,
})

const defaultProps = {
  results: [],
  autoLimit: false,
  handleSelectEditPolicy: vi.fn(),
}

describe('RLSTesterResults', () => {
  describe('access badge', () => {
    it('shows "No access" badge when table has RLS enabled but no policies', () => {
      render(
        <RLSTesterResults
          {...defaultProps}
          parseQueryResults={{
            tables: [makeTable()],
            operation: 'SELECT',
            role: 'anon',
          }}
        />
      )
      expect(screen.getByText('No access')).toBeInTheDocument()
    })

    it('shows "No access" badge when a policy definition is false', () => {
      render(
        <RLSTesterResults
          {...defaultProps}
          parseQueryResults={{
            tables: [makeTable({ tablePolicies: [makePolicy('false')] })],
            operation: 'SELECT',
            role: 'anon',
          }}
        />
      )
      expect(screen.getByText('No access')).toBeInTheDocument()
    })

    it('shows "Has access" badge when results are empty and user has access', () => {
      render(
        <RLSTesterResults
          {...defaultProps}
          results={[]}
          parseQueryResults={{
            tables: [makeTable({ tablePolicies: [makePolicy('auth.uid() = user_id')] })],
            operation: 'SELECT',
            role: 'authenticated',
          }}
        />
      )
      expect(screen.getByText('Has access')).toBeInTheDocument()
    })

    it('shows "Can access" badge when results are returned', () => {
      render(
        <RLSTesterResults
          {...defaultProps}
          results={[{ id: 1 }]}
          parseQueryResults={{
            tables: [makeTable({ tablePolicies: [makePolicy('auth.uid() = user_id')] })],
            operation: 'SELECT',
            role: 'authenticated',
          }}
        />
      )
      expect(screen.getByText('Can access')).toBeInTheDocument()
    })
  })

  describe('policy admonitions', () => {
    it('shows service role admonition for postgres role', () => {
      render(
        <RLSTesterResults
          {...defaultProps}
          parseQueryResults={{
            tables: [makeTable()],
            operation: 'SELECT',
            role: undefined,
          }}
        />
      )
      expect(screen.getByText(/bypasses all RLS policies/)).toBeInTheDocument()
    })

    it('shows "no policies" admonition when RLS is enabled but no policies exist', () => {
      render(
        <RLSTesterResults
          {...defaultProps}
          parseQueryResults={{
            tables: [makeTable({ table: 'profiles', tablePolicies: [] })],
            operation: 'SELECT',
            role: 'anon',
          }}
        />
      )
      expect(screen.getByText(/no policies set up/)).toBeInTheDocument()
      expect(screen.getByText(/public.profiles/)).toBeInTheDocument()
    })

    it('shows "policy false" admonition when a policy evaluates to false', () => {
      render(
        <RLSTesterResults
          {...defaultProps}
          parseQueryResults={{
            tables: [makeTable({ table: 'secrets', tablePolicies: [makePolicy('false')] })],
            operation: 'SELECT',
            role: 'anon',
          }}
        />
      )
      expect(screen.getByText(/evaluates to/)).toBeInTheDocument()
      expect(screen.getByText(/public.secrets/)).toBeInTheDocument()
    })
  })

  describe('"Ran as" section', () => {
    it('shows postgres for service role', () => {
      render(
        <RLSTesterResults
          {...defaultProps}
          parseQueryResults={{
            tables: [],
            operation: 'SELECT',
            role: undefined,
          }}
        />
      )
      expect(screen.getAllByText('postgres').length).toBeGreaterThan(0)
    })

    it('shows "an Anonymous user" for anon role', () => {
      render(
        <RLSTesterResults
          {...defaultProps}
          parseQueryResults={{
            tables: [],
            operation: 'SELECT',
            role: 'anon',
          }}
        />
      )
      expect(screen.getByText('an Anonymous user')).toBeInTheDocument()
      expect(screen.getByText('Not logged in user')).toBeInTheDocument()
    })

    it('shows user email and ID when a user is present', () => {
      render(
        <RLSTesterResults
          {...defaultProps}
          parseQueryResults={{
            tables: [],
            operation: 'SELECT',
            role: 'authenticated',
            user: {
              id: 'user-123',
              email: 'alice@example.com',
            } as any,
          }}
        />
      )
      expect(screen.getByText('alice@example.com')).toBeInTheDocument()
      expect(screen.getByText('ID: user-123')).toBeInTheDocument()
    })
  })
})
