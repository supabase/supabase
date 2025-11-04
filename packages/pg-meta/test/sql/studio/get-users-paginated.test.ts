import { expect, test, describe } from 'vitest'
import { getPaginatedUsersSQL } from '../../../src/sql/studio/get-users-paginated'

describe('getPaginatedUsersSQL', () => {
  describe('basic pagination', () => {
    test('generates default query with no filters', () => {
      const result = getPaginatedUsersSQL({
        sort: 'created_at',
        order: 'desc',
      })

      expect(result).toContain('select')
      expect(result).toContain('auth.users')
      expect(result).toContain('order by')
      expect(result).toContain('"created_at" desc nulls last')
      expect(result).toContain('limit')
      expect(result).toContain('50')
      expect(result).toContain('offset')
      expect(result).toContain('0')
    })

    test('respects custom limit', () => {
      const result = getPaginatedUsersSQL({
        sort: 'created_at',
        order: 'desc',
        limit: 100,
      })

      expect(result).toContain('100')
    })

    test('calculates offset based on page and limit', () => {
      const result = getPaginatedUsersSQL({
        sort: 'created_at',
        order: 'desc',
        page: 2,
        limit: 25,
      })

      expect(result).toContain('50')
    })

    test('supports ascending order', () => {
      const result = getPaginatedUsersSQL({
        sort: 'email',
        order: 'asc',
      })

      expect(result).toContain('"email" asc nulls last')
    })

    test('supports different sort columns', () => {
      const result = getPaginatedUsersSQL({
        sort: 'last_sign_in_at',
        order: 'desc',
      })

      expect(result).toContain('"last_sign_in_at" desc nulls last')
    })
  })

  describe('keyword search', () => {
    test('searches across multiple fields', () => {
      const result = getPaginatedUsersSQL({
        sort: 'created_at',
        order: 'desc',
        keywords: 'john',
      })

      expect(result).toContain("id::text like '%john%'")
      expect(result).toContain("email like '%john%'")
      expect(result).toContain("phone like '%john%'")
      expect(result).toContain("raw_user_meta_data->>'full_name' ilike '%john%'")
      expect(result).toContain("raw_user_meta_data->>'first_name' ilike '%john%'")
      expect(result).toContain("raw_user_meta_data->>'last_name' ilike '%john%'")
      expect(result).toContain("raw_user_meta_data->>'display_name' ilike '%john%'")
    })

    test('escapes single quotes in keywords', () => {
      const result = getPaginatedUsersSQL({
        sort: 'created_at',
        order: 'desc',
        keywords: "O'Brien",
      })

      expect(result).toContain("O''Brien")
      expect(result).not.toContain("O'Brien")
    })

    test('does not add search conditions for empty keywords', () => {
      const result = getPaginatedUsersSQL({
        sort: 'created_at',
        order: 'desc',
        keywords: '',
      })

      expect(result).not.toContain("like '%'")
    })
  })

  describe('verified filter', () => {
    test('filters for verified users', () => {
      const result = getPaginatedUsersSQL({
        sort: 'created_at',
        order: 'desc',
        verified: 'verified',
      })

      expect(result).toContain('email_confirmed_at IS NOT NULL or phone_confirmed_at IS NOT NULL')
    })

    test('filters for unverified users', () => {
      const result = getPaginatedUsersSQL({
        sort: 'created_at',
        order: 'desc',
        verified: 'unverified',
      })

      expect(result).toContain('email_confirmed_at IS NULL AND phone_confirmed_at IS NULL')
    })

    test('filters for anonymous users', () => {
      const result = getPaginatedUsersSQL({
        sort: 'created_at',
        order: 'desc',
        verified: 'anonymous',
      })

      expect(result).toContain('is_anonymous is true')
    })
  })

  describe('provider filter', () => {
    test('filters by single provider', () => {
      const result = getPaginatedUsersSQL({
        sort: 'created_at',
        order: 'desc',
        providers: ['google'],
      })

      expect(result).toContain("(raw_app_meta_data->>'providers')::jsonb ?| array['google']")
    })

    test('filters by multiple providers', () => {
      const result = getPaginatedUsersSQL({
        sort: 'created_at',
        order: 'desc',
        providers: ['google', 'github'],
      })

      expect(result).toContain("array['google', 'github']")
    })

    test('handles SAML 2.0 provider with special logic', () => {
      const result = getPaginatedUsersSQL({
        sort: 'created_at',
        order: 'desc',
        providers: ['saml 2.0', 'google'],
      })

      expect(result).toContain('jsonb_agg(case when value ~ ')
      expect(result).toContain("'sso'")
      expect(result).toContain("'google'")
    })

    test('does not add provider filter for empty array', () => {
      const result = getPaginatedUsersSQL({
        sort: 'created_at',
        order: 'desc',
        providers: [],
      })

      // raw_app_meta_data is in the SELECT clause, but not in WHERE clause for filtering
      expect(result).not.toContain("(raw_app_meta_data->>'providers')")
    })
  })

  describe('combined filters', () => {
    test('combines keywords and verified filter', () => {
      const result = getPaginatedUsersSQL({
        sort: 'created_at',
        order: 'desc',
        keywords: 'john',
        verified: 'verified',
      })

      expect(result).toContain("like '%john%'")
      expect(result).toContain('email_confirmed_at IS NOT NULL')
      expect(result).toContain('and')
    })

    test('combines all filter types', () => {
      const result = getPaginatedUsersSQL({
        sort: 'created_at',
        order: 'desc',
        keywords: 'john',
        verified: 'verified',
        providers: ['google'],
      })

      expect(result).toContain("like '%john%'")
      expect(result).toContain('email_confirmed_at IS NOT NULL')
      expect(result).toContain('raw_app_meta_data')
      expect(result).toContain('and')
    })
  })

  describe('optimized search by column', () => {
    describe('email search', () => {
      test('generates optimized email search without startAt', () => {
        const result = getPaginatedUsersSQL({
          sort: 'created_at',
          order: 'desc',
          column: 'email',
          keywords: 'john',
        })

        expect(result).toContain("where lower(email) >= 'john'")
        expect(result).toContain("and lower(email) < 'joho'")
        expect(result).toContain("instance_id = '00000000-0000-0000-0000-000000000000'::uuid")
        expect(result).toContain('order by instance_id, lower(email) asc')
        expect(result).not.toContain('offset')
      })

      test('generates optimized email search with startAt', () => {
        const result = getPaginatedUsersSQL({
          sort: 'created_at',
          order: 'desc',
          column: 'email',
          keywords: 'john',
          startAt: 'john@example.com',
        })

        expect(result).toContain("where lower(email) > 'john@example.com'")
        expect(result).toContain("and lower(email) < 'joho'")
      })

      test('handles empty keywords in email search', () => {
        const result = getPaginatedUsersSQL({
          sort: 'created_at',
          order: 'desc',
          column: 'email',
          keywords: '',
        })

        expect(result).toContain("where lower(email) >= ''")
        expect(result).not.toContain('and lower(email) <')
      })
    })

    describe('phone search', () => {
      test('generates optimized phone search without startAt', () => {
        const result = getPaginatedUsersSQL({
          sort: 'created_at',
          order: 'desc',
          column: 'phone',
          keywords: '+1234',
        })

        expect(result).toContain("where phone >= '+1234'")
        expect(result).toContain("and phone < '+1235'")
        expect(result).toContain('order by phone asc')
        expect(result).not.toContain('offset')
      })

      test('generates optimized phone search with startAt', () => {
        const result = getPaginatedUsersSQL({
          sort: 'created_at',
          order: 'desc',
          column: 'phone',
          keywords: '+1234',
          startAt: '+1234567890',
        })

        expect(result).toContain("where phone > '+1234567890'")
        expect(result).toContain("and phone < '+1235'")
      })

      test('handles empty keywords in phone search', () => {
        const result = getPaginatedUsersSQL({
          sort: 'created_at',
          order: 'desc',
          column: 'phone',
          keywords: '',
        })

        expect(result).toContain("where phone >= ''")
        expect(result).not.toContain('and phone <')
      })
    })

    describe('id (UUID) search', () => {
      test('generates range query for partial UUID', () => {
        const result = getPaginatedUsersSQL({
          sort: 'created_at',
          order: 'desc',
          column: 'id',
          keywords: 'abc123',
        })

        expect(result).toContain("where id >= 'abc12300-0000-4000-8000-000000000000'")
        expect(result).toContain("and id < 'abc123ff-ffff-4fff-bfff-ffffffffffff'")
        expect(result).toContain('order by id asc')
      })

      test('generates exact match for complete UUID', () => {
        const result = getPaginatedUsersSQL({
          sort: 'created_at',
          order: 'desc',
          column: 'id',
          keywords: '12345678-1234-5678-9abc-def123456789',
        })

        expect(result).toContain("where id = '12345678-1234-5678-9abc-def123456789'")
        expect(result).not.toContain('and id <')
      })

      test('handles empty keywords in id search', () => {
        const result = getPaginatedUsersSQL({
          sort: 'created_at',
          order: 'desc',
          column: 'id',
          keywords: '',
        })

        expect(result).toContain("where id >= '00000000-0000-0000-0000-000000000000'")
        expect(result).toContain("and id < 'ffffffff-ffff-ffff-ffff-ffffffffffff'")
      })

      test('uses startAt when provided', () => {
        const result = getPaginatedUsersSQL({
          sort: 'created_at',
          order: 'desc',
          column: 'id',
          keywords: 'abc',
          startAt: 'abc12300-0000-4000-8000-000000000000',
        })

        expect(result).toContain("where id > 'abc12300-0000-4000-8000-000000000000'")
      })
    })
  })

  describe('query structure', () => {
    test('includes all required user columns', () => {
      const result = getPaginatedUsersSQL({
        sort: 'created_at',
        order: 'desc',
      })

      expect(result).toContain('auth.users.id')
      expect(result).toContain('auth.users.email')
      expect(result).toContain('auth.users.banned_until')
      expect(result).toContain('auth.users.created_at')
      expect(result).toContain('auth.users.confirmed_at')
      expect(result).toContain('auth.users.confirmation_sent_at')
      expect(result).toContain('auth.users.is_anonymous')
      expect(result).toContain('auth.users.is_sso_user')
      expect(result).toContain('auth.users.invited_at')
      expect(result).toContain('auth.users.last_sign_in_at')
      expect(result).toContain('auth.users.phone')
      expect(result).toContain('auth.users.raw_app_meta_data')
      expect(result).toContain('auth.users.raw_user_meta_data')
      expect(result).toContain('auth.users.updated_at')
    })

    test('includes providers aggregation from identities', () => {
      const result = getPaginatedUsersSQL({
        sort: 'created_at',
        order: 'desc',
      })

      expect(result).toContain('auth.identities')
      expect(result).toContain('array_agg(distinct i.provider)')
      expect(result).toContain('i.user_id = users_data.id')
      expect(result).toContain('as providers')
    })

    test('uses CTE for users_data', () => {
      const result = getPaginatedUsersSQL({
        sort: 'created_at',
        order: 'desc',
      })

      expect(result).toContain('with')
      expect(result).toContain('users_data as')
    })
  })
})
