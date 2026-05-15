import { describe, expect, it } from 'vitest'

import { lintInfoMap } from './Linter.utils'
import { Lint } from '@/data/lint/lint-query'

const projectRef = 'abc'
const trickySchema = 'a&b=c'
const trickyName = 'd e+f'

describe('Linter.utils lintInfoMap link encoding', () => {
  const cases: Array<{ name: string; nameParam?: string; hasSchema: boolean }> = [
    { name: 'unindexed_foreign_keys', hasSchema: true },
    { name: 'unused_index', nameParam: 'table', hasSchema: true },
    { name: 'multiple_permissive_policies', nameParam: 'search', hasSchema: true },
    { name: 'policy_exists_rls_disabled', nameParam: 'search', hasSchema: true },
    { name: 'rls_enabled_no_policy', nameParam: 'search', hasSchema: true },
    { name: 'duplicate_index', nameParam: 'table', hasSchema: true },
    { name: 'function_search_path_mutable', nameParam: 'search', hasSchema: true },
    { name: 'rls_disabled_in_public', nameParam: 'search', hasSchema: true },
    { name: 'extension_in_public', nameParam: 'filter', hasSchema: false },
    { name: 'sensitive_columns_exposed', nameParam: 'table', hasSchema: true },
    { name: 'rls_policy_always_true', nameParam: 'search', hasSchema: true },
    { name: 'pg_graphql_anon_table_exposed', nameParam: 'table', hasSchema: true },
    { name: 'pg_graphql_authenticated_table_exposed', nameParam: 'table', hasSchema: true },
    { name: 'anon_security_definer_function_executable', nameParam: 'search', hasSchema: true },
    {
      name: 'authenticated_security_definer_function_executable',
      nameParam: 'search',
      hasSchema: true,
    },
  ]

  for (const { name, nameParam, hasSchema } of cases) {
    it(`preserves special characters in metadata for ${name}`, () => {
      const info = lintInfoMap.find((entry) => entry.name === name)
      expect(info, `expected ${name} in lintInfoMap`).toBeDefined()

      const url = info!.link({
        projectRef,
        metadata: {
          schema: trickySchema,
          name: trickyName,
        } as unknown as Lint['metadata'],
      })

      const parsed = new URL(url, 'http://example.com')

      if (hasSchema) {
        expect(parsed.searchParams.get('schema')).toBe(trickySchema)
      }
      if (nameParam) {
        expect(parsed.searchParams.get(nameParam)).toBe(trickyName)
      }
    })
  }

  it('preserves slash and space in bucket_id for public_bucket_allows_listing', () => {
    const info = lintInfoMap.find((entry) => entry.name === 'public_bucket_allows_listing')
    expect(info).toBeDefined()
    const url = info!.link({
      projectRef,
      metadata: {
        bucket_id: 'a/b c',
      } as unknown as Lint['metadata'],
    })
    expect(url).toBe('/project/abc/storage/files/buckets/a%2Fb%20c')
  })
})
