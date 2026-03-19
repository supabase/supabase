import type {
  GitHubAccount,
  Integration,
  VercelAccount,
  VercelTeamAccount,
} from 'data/integrations/integrations.types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getInitialMigrationSQLFromGitHubRepo,
  getIntegrationConfigurationUrl,
} from './integration-utils'

vi.mock('data/fetchers', () => ({
  fetchHandler: vi.fn(),
}))

describe('integration-utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getInitialMigrationSQLFromGitHubRepo', () => {
    it('should return null when no externalId is provided', async () => {
      const result = await getInitialMigrationSQLFromGitHubRepo()
      expect(result).toBeNull()
    })

    it('should fetch and combine migration files correctly', async () => {
      const mockGitHubUrl = 'https://github.com/org/repo/tree/main/examples/with-supabase'
      const mockSupabaseFiles = [{ name: 'seed.sql', download_url: 'https://github.com/seed.sql' }]
      const mockMigrationFiles = [
        { name: '20230101000000_initial.sql', download_url: 'https://github.com/migration1.sql' },
        { name: '20230101000001_second.sql', download_url: 'https://github.com/migration2.sql' },
      ]

      const mockMigrationContent1 = 'CREATE TABLE users (id serial PRIMARY KEY);'
      const mockMigrationContent2 = 'CREATE TABLE posts (id serial PRIMARY KEY);'
      const mockSeedContent = 'INSERT INTO users (id) VALUES (1);'

      // Mock the fetch responses
      const { fetchHandler } = await import('data/fetchers')
      const mockFetchHandler = fetchHandler as unknown as ReturnType<typeof vi.fn>
      mockFetchHandler
        .mockResolvedValueOnce(
          new Response(JSON.stringify(mockSupabaseFiles), {
            status: 200,
            statusText: 'OK',
            headers: { 'Content-Type': 'application/json' },
          })
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify(mockMigrationFiles), {
            status: 200,
            statusText: 'OK',
            headers: { 'Content-Type': 'application/json' },
          })
        )
        .mockResolvedValueOnce(
          new Response(mockSeedContent, {
            status: 200,
            statusText: 'OK',
            headers: { 'Content-Type': 'text/plain' },
          })
        )
        .mockResolvedValueOnce(
          new Response(mockMigrationContent1, {
            status: 200,
            statusText: 'OK',
            headers: { 'Content-Type': 'text/plain' },
          })
        )
        .mockResolvedValueOnce(
          new Response(mockMigrationContent2, {
            status: 200,
            statusText: 'OK',
            headers: { 'Content-Type': 'text/plain' },
          })
        )

      const result = await getInitialMigrationSQLFromGitHubRepo(mockGitHubUrl)

      expect(result).toContain(mockMigrationContent1)
      expect(result).toContain(mockMigrationContent2)
      expect(result).toContain(mockSeedContent)
      expect(result).toContain('create schema if not exists supabase_migrations')
      expect(result).toContain('create table if not exists supabase_migrations.schema_migrations')
    })

    it('should handle GitHub API errors gracefully', async () => {
      const mockGitHubUrl = 'https://github.com/org/repo/tree/main/examples/with-supabase'

      const { fetchHandler } = await import('data/fetchers')
      const mockFetchHandler = fetchHandler as unknown as ReturnType<typeof vi.fn>

      mockFetchHandler
        .mockResolvedValueOnce(
          new Response(null, {
            status: 404,
            statusText: 'Not Found',
            headers: { 'Content-Type': 'application/json' },
          })
        )
        .mockResolvedValueOnce(
          new Response(null, {
            status: 404,
            statusText: 'Not Found',
            headers: { 'Content-Type': 'application/json' },
          })
        )

      const result = await getInitialMigrationSQLFromGitHubRepo(mockGitHubUrl)
      expect(result).toBeNull()
    })
  })

  describe('getIntegrationConfigurationUrl', () => {
    it('should return correct Vercel configuration URL for personal account', () => {
      const vercelIntegration: Integration = {
        id: '123',
        added_by: {
          username: 'testuser',
          id: '123',
          primary_email: 'test@example.com',
        },
        inserted_at: '2024-01-01',
        updated_at: '2024-01-01',
        connections: [],
        organization: { slug: 'org' },
        integration: { name: 'Vercel' },
        metadata: {
          account: {
            type: 'Personal',
            name: 'Test User',
            avatar: 'test-avatar',
            source: 'marketplace',
            owner_id: '123',
          } as VercelAccount,
          configuration_id: '123',
        },
      }

      const result = getIntegrationConfigurationUrl(vercelIntegration)
      expect(result).toBe('https://vercel.com/dashboard/integrations/123')
    })

    it('should return correct Vercel configuration URL for team account', () => {
      const vercelIntegration: Integration = {
        id: '123',
        added_by: {
          username: 'testuser',
          id: '123',
          primary_email: 'test@example.com',
        },
        inserted_at: '2024-01-01',
        updated_at: '2024-01-01',
        connections: [],
        organization: { slug: 'org' },
        integration: { name: 'Vercel' },
        metadata: {
          account: {
            type: 'Team',
            name: 'Test Team',
            avatar: 'test-avatar',
            source: 'marketplace',
            owner_id: '123',
            team_id: 'team123',
            team_slug: 'my-team',
          } as VercelTeamAccount,
          configuration_id: '123',
        },
      }

      const result = getIntegrationConfigurationUrl(vercelIntegration)
      expect(result).toBe('https://vercel.com/dashboard/my-team/integrations/123')
    })

    it('should return correct GitHub configuration URL for personal account', () => {
      const githubIntegration: Integration = {
        id: '456',
        added_by: {
          username: 'testuser',
          id: '123',
          primary_email: 'test@example.com',
        },
        inserted_at: '2024-01-01',
        updated_at: '2024-01-01',
        connections: [],
        organization: { slug: 'org' },
        integration: { name: 'GitHub' },
        metadata: {
          account: {
            type: 'User',
            name: 'Test User',
            avatar: 'test-avatar',
            installed_by_user_id: 123,
          } as GitHubAccount,
          installation_id: 456,
        },
      }

      const result = getIntegrationConfigurationUrl(githubIntegration)
      expect(result).toBe('https://github.com/settings/installations/456')
    })

    it('should return correct GitHub configuration URL for organization', () => {
      const githubIntegration: Integration = {
        id: '456',
        added_by: {
          username: 'testuser',
          id: '123',
          primary_email: 'test@example.com',
        },
        inserted_at: '2024-01-01',
        updated_at: '2024-01-01',
        connections: [],
        organization: { slug: 'org' },
        integration: { name: 'GitHub' },
        metadata: {
          account: {
            type: 'Organization',
            name: 'org-name',
            avatar: 'test-avatar',
            installed_by_user_id: 123,
          } as GitHubAccount,
          installation_id: 456,
        },
      }

      const result = getIntegrationConfigurationUrl(githubIntegration)
      expect(result).toBe('https://github.com/organizations/org-name/settings/installations/456')
    })

    it('should return empty string for unknown integration', () => {
      const unknownIntegration = {
        id: '789',
        added_by: {
          username: 'testuser',
          id: '123',
          primary_email: 'test@example.com',
        },
        inserted_at: '2024-01-01',
        updated_at: '2024-01-01',
        connections: [],
        organization: { slug: 'org' },
        integration: { name: 'Unknown' as any },
        metadata: {
          account: {
            type: 'User',
            name: 'Test User',
            avatar: 'test-avatar',
            installed_by_user_id: 123,
          } as GitHubAccount,
          installation_id: 789,
        },
      } as Integration

      const result = getIntegrationConfigurationUrl(unknownIntegration)
      expect(result).toBe('')
    })
  })
})
