import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { getMigrations } from './migrations-query'
import { addAPIMock } from '@/tests/lib/msw'

describe('getMigrations', () => {
  it('returns the list of migrations', async () => {
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: () =>
        HttpResponse.json([
          {
            version: '20240202000000',
            name: 'add_projects',
            statements: ['create table public.projects (id int)'],
          },
          { version: '20240101000000', name: 'create_users', statements: null },
        ]),
    })

    const result = await getMigrations({ projectRef: 'default' })

    expect(result).toEqual([
      {
        version: '20240202000000',
        name: 'add_projects',
        statements: ['create table public.projects (id int)'],
      },
      { version: '20240101000000', name: 'create_users', statements: null },
    ])
  })

  it('treats a missing migrations table as an empty list instead of an error', async () => {
    // Safety net: the SQL itself is defensive (see @supabase/pg-meta getMigrationsSql),
    // but if the relation-missing error still surfaces it must not become a failed query
    // that 400s and retries on every project page load.
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: () =>
        HttpResponse.json(
          { message: 'relation "supabase_migrations.schema_migrations" does not exist' },
          { status: 400 }
        ),
    })

    const result = await getMigrations({ projectRef: 'default' })

    expect(result).toEqual([])
  })

  it('rethrows other errors', async () => {
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: () => HttpResponse.json({ message: 'permission denied' }, { status: 400 }),
    })

    await expect(getMigrations({ projectRef: 'default' })).rejects.toThrowError('permission denied')
  })
})
