import { expect, test, describe } from 'vitest'
import { getUsersCountSQL, USERS_COUNT_ESTIMATE_SQL } from '../../../src/sql/studio/get-users-count'

describe('getUsersCountSQL', () => {
  describe('basic count queries', () => {
    test('generates default count query without filters', () => {
      const result = getUsersCountSQL({})

      expect(result).toContain('select count(*) from auth.users')
      expect(result).toContain('count_estimate')
      expect(result).toContain('is_estimate')
    })

    test('generates query with estimate logic', () => {
      const result = getUsersCountSQL({})

      expect(result).toContain(USERS_COUNT_ESTIMATE_SQL)
      expect(result).toContain('approximation')
      expect(result).toContain('case')
      expect(result).toContain('when estimate = -1')
    })
  })

  describe('forceExactCount mode', () => {
    test('generates exact count query when forceExactCount is true', () => {
      const result = getUsersCountSQL({
        forceExactCount: true,
      })

      expect(result).toContain('select (select count(*) from auth.users)')
      expect(result).toContain('false as is_estimate')
      expect(result).not.toContain('approximation')
      expect(result).not.toContain('pg_temp.count_estimate')
    })

    test('respects filters in exact count mode', () => {
      const result = getUsersCountSQL({
        forceExactCount: true,
        keywords: 'john',
      })

      expect(result).toContain("ilike '%john%'")
      expect(result).toContain('false as is_estimate')
    })
  })

  describe('keyword search', () => {
    test('searches across id, email, and phone in unified mode', () => {
      const result = getUsersCountSQL({
        keywords: 'john',
      })

      expect(result).toContain("id::text ilike '%john%'")
      expect(result).toContain("email ilike '%john%'")
      expect(result).toContain("phone ilike '%john%'")
    })

    test('escapes single quotes in keywords', () => {
      const result = getUsersCountSQL({
        keywords: "O'Brien",
      })

      expect(result).toContain("O''Brien")
      expect(result).not.toContain("O'Brien where")
    })

    test('does not add search conditions for empty keywords', () => {
      const result = getUsersCountSQL({
        keywords: '',
      })

      expect(result).not.toContain("ilike '%'")
    })
  })

  describe('filter parameter', () => {
    test('filters for verified users', () => {
      const result = getUsersCountSQL({
        filter: 'verified',
      })

      expect(result).toContain('email_confirmed_at IS NOT NULL or phone_confirmed_at IS NOT NULL')
    })

    test('filters for unverified users', () => {
      const result = getUsersCountSQL({
        filter: 'unverified',
      })

      expect(result).toContain('email_confirmed_at IS NULL AND phone_confirmed_at IS NULL')
    })

    test('filters for anonymous users', () => {
      const result = getUsersCountSQL({
        filter: 'anonymous',
      })

      expect(result).toContain('is_anonymous is true')
    })
  })

  describe('provider filter', () => {
    test('filters by single provider', () => {
      const result = getUsersCountSQL({
        providers: ['google'],
      })

      expect(result).toContain("(raw_app_meta_data->>'providers')::jsonb ?| array['google']")
    })

    test('filters by multiple providers', () => {
      const result = getUsersCountSQL({
        providers: ['google', 'github'],
      })

      expect(result).toContain("array['google', 'github']")
    })

    test('handles SAML 2.0 provider with special logic', () => {
      const result = getUsersCountSQL({
        providers: ['saml 2.0', 'google'],
      })

      expect(result).toContain('jsonb_agg(case when value ~ ')
      expect(result).toContain("'sso'")
      expect(result).toContain("'google'")
    })

    test('does not add provider filter for empty array', () => {
      const result = getUsersCountSQL({
        providers: [],
      })

      expect(result).not.toContain('raw_app_meta_data')
    })
  })

  describe('combined filters in unified mode', () => {
    test('combines keywords and filter', () => {
      const result = getUsersCountSQL({
        keywords: 'john',
        filter: 'verified',
      })

      expect(result).toContain("ilike '%john%'")
      expect(result).toContain('email_confirmed_at IS NOT NULL')
      expect(result).toContain('and')
    })

    test('combines all filter types', () => {
      const result = getUsersCountSQL({
        keywords: 'john',
        filter: 'verified',
        providers: ['google'],
      })

      expect(result).toContain("ilike '%john%'")
      expect(result).toContain('email_confirmed_at IS NOT NULL')
      expect(result).toContain('raw_app_meta_data')
      expect(result).toContain('and')
    })
  })

  describe('optimized search by column', () => {
    describe('email column search', () => {
      test('generates optimized email count query', () => {
        const result = getUsersCountSQL({
          column: 'email',
          keywords: 'john',
        })

      expect(result).toContain("lower(email) >= 'john'")
      expect(result).toContain("and lower(email) < 'joho'")
        expect(result).toContain("instance_id = '00000000-0000-0000-0000-000000000000'::uuid")
      })

      test('escapes quotes in email search', () => {
        const result = getUsersCountSQL({
          column: 'email',
          keywords: "o'brien",
        })

        expect(result).toContain("o''brien")
      })

      test('handles empty keywords in email search', () => {
        const result = getUsersCountSQL({
          column: 'email',
          keywords: '',
        })

        // Should not be in optimized mode without valid keywords
        expect(result).not.toContain("lower(email) >=")
      })

      test('requires keywords for optimized email search', () => {
        const result = getUsersCountSQL({
          column: 'email',
        })

        expect(result).not.toContain("lower(email) >=")
      })
    })

    describe('phone column search', () => {
      test('generates optimized phone count query', () => {
        const result = getUsersCountSQL({
          column: 'phone',
          keywords: '+1234',
        })

        expect(result).toContain("phone >= '+1234'")
        expect(result).toContain("and phone < '+1235'")
      })

      test('escapes quotes in phone search', () => {
        const result = getUsersCountSQL({
          column: 'phone',
          keywords: "'+1234",
        })

        expect(result).toContain("''+1234")
      })
    })

    describe('id column search', () => {
      test('generates range query for partial UUID', () => {
        const result = getUsersCountSQL({
          column: 'id',
          keywords: 'abc123',
        })

        expect(result).toContain("id >= 'abc12300-0000-4000-8000-000000000000'")
        expect(result).toContain("and id < 'abc123ff-ffff-4fff-bfff-ffffffffffff'")
      })

      test('generates exact match for complete UUID', () => {
        const result = getUsersCountSQL({
          column: 'id',
          keywords: '12345678-1234-5678-9abc-def123456789',
        })

        expect(result).toContain("id = '12345678-1234-5678-9abc-def123456789'")
        expect(result).not.toContain('and id <')
      })

      test('handles empty string in id search', () => {
        const result = getUsersCountSQL({
          column: 'id',
          keywords: '',
        })

        // Should not be in optimized mode without valid keywords
        expect(result).not.toContain("id >=")
      })
    })

    describe('optimized mode ignores other filters', () => {
      test('ignores filter parameter in optimized email search', () => {
        const result = getUsersCountSQL({
          column: 'email',
          keywords: 'john',
          filter: 'verified',
        })

        expect(result).toContain("lower(email) >= 'john'")
        expect(result).not.toContain('email_confirmed_at')
      })

      test('ignores providers parameter in optimized phone search', () => {
        const result = getUsersCountSQL({
          column: 'phone',
          keywords: '+1234',
          providers: ['google'],
        })

        expect(result).toContain("phone >= '+1234'")
        expect(result).not.toContain('raw_app_meta_data')
      })

      test('ignores other filters in optimized id search', () => {
        const result = getUsersCountSQL({
          column: 'id',
          keywords: 'abc123',
          filter: 'verified',
          providers: ['google'],
        })

        expect(result).toContain("id >= 'abc12300-0000-4000-8000-000000000000'")
        expect(result).not.toContain('email_confirmed_at')
        expect(result).not.toContain('raw_app_meta_data')
      })
    })
  })

  describe('estimate logic', () => {
    test('includes threshold check', () => {
      const result = getUsersCountSQL({})

      expect(result).toContain('when estimate > 50000')
    })

    test('uses exact count for small tables', () => {
      const result = getUsersCountSQL({})

      expect(result).toContain('else (select count(*) from auth.users)')
    })

    test('escapes SQL for count_estimate function', () => {
      const result = getUsersCountSQL({
        keywords: "test'value",
      })

      // The inner SQL should be double-escaped for the count_estimate function
      expect(result).toContain("''")
    })

    test('returns is_estimate flag', () => {
      const result = getUsersCountSQL({})

      expect(result).toContain('as is_estimate')
    })
  })

  describe('query structure', () => {
    test('uses CTE for approximation', () => {
      const result = getUsersCountSQL({})

      expect(result).toContain('with approximation as')
      expect(result).toContain('from approximation')
    })

    test('includes count_estimate function definition', () => {
      const result = getUsersCountSQL({})

      expect(result.toLowerCase()).toContain('create or replace function pg_temp.count_estimate')
      expect(result.toLowerCase()).toContain('returns integer')
    })

    test('properly formats query with semicolon', () => {
      const result = getUsersCountSQL({
        forceExactCount: true,
      })

      expect(result.trim().endsWith(';')).toBe(true)
    })
  })

  describe('USERS_COUNT_ESTIMATE_SQL constant', () => {
    test('queries pg_class for estimate', () => {
      expect(USERS_COUNT_ESTIMATE_SQL).toContain('select reltuples as estimate')
      expect(USERS_COUNT_ESTIMATE_SQL).toContain('from pg_class')
      expect(USERS_COUNT_ESTIMATE_SQL).toContain("oid = 'auth.users'::regclass")
    })
  })
})

