import { queryIntent } from '@supabase/pg-meta'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { sparkOid } from './catalog'
import type { SparkDescription } from './client'
import { answerSparkIntent } from './index'
import { mswServer } from '@/tests/lib/msw'

const SPARK_URL = 'http://spark.test'

// Trimmed from a real `GET /_spark/v1/schema` for the PoC's todos project.
const description: SparkDescription = {
  schema_version: '35-2668ece544f933e8',
  managed_schemas: ['auth', 'storage', 'supabase_migrations'],
  schemas: [{ name: 'public', comment: null }],
  enums: [],
  views: [],
  tables: [
    {
      schema: 'auth',
      name: 'users',
      managed: true,
      rls_enabled: false,
      rls_forced: false,
      comment: null,
      columns: [
        {
          name: 'id',
          position: 2,
          type: 'uuid',
          not_null: true,
          default: null,
          identity: null,
          generated: null,
          comment: null,
        },
      ],
      constraints: [],
      indexes: [],
      policies: [],
    },
    {
      schema: 'public',
      name: 'todos',
      managed: false,
      rls_enabled: true,
      rls_forced: false,
      comment: null,
      columns: [
        {
          name: 'id',
          position: 1,
          type: 'bigint',
          not_null: true,
          default: null,
          identity: 'd',
          generated: null,
          comment: null,
        },
        {
          name: 'user_id',
          position: 2,
          type: 'uuid',
          not_null: true,
          default: 'auth.uid()',
          identity: null,
          generated: null,
          comment: null,
        },
        {
          name: 'title',
          position: 3,
          type: 'text',
          not_null: true,
          default: null,
          identity: null,
          generated: null,
          comment: null,
        },
        {
          name: 'done',
          position: 4,
          type: 'boolean',
          not_null: true,
          default: 'false',
          identity: null,
          generated: null,
          comment: null,
        },
      ],
      constraints: [
        {
          name: 'todos_pkey',
          type: 'p',
          def: 'PRIMARY KEY (id)',
          columns: ['id'],
          references: null,
        },
        {
          name: 'todos_user_id_fkey',
          type: 'f',
          def: 'FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE',
          columns: ['user_id'],
          references: { schema: 'auth', table: 'users', columns: ['id'] },
        },
      ],
      indexes: [
        {
          name: 'todos_pkey',
          def: 'CREATE UNIQUE INDEX todos_pkey ON public.todos USING btree (id)',
          unique: true,
          constraint: 'todos_pkey',
        },
      ],
      policies: [
        {
          name: 'Users manage their own todos',
          cmd: '*',
          permissive: true,
          roles: ['authenticated'],
          using: '(auth.uid() = user_id)',
          check: '(auth.uid() = user_id)',
        },
      ],
    },
  ],
}

const todosId = sparkOid('public.todos')

/** Spark's admin API: the description, the ledger, and read-only queries recorded in `queries`. */
const mockSpark = (rowsFor: (sql: string) => Record<string, unknown>[]) => {
  const queries: { query: string; read_only: boolean }[] = []
  mswServer.use(
    http.get(`${SPARK_URL}/_spark/v1/schema`, () => HttpResponse.json(description)),
    http.get(`${SPARK_URL}/_spark/v1/migrations`, () =>
      HttpResponse.json([
        { version: '20260101000000', name: 'todos', statements: ['create table public.todos ()'] },
        { version: '20260102000000', name: 'later', statements: null },
      ])
    ),
    http.post(`${SPARK_URL}/_spark/v1/query`, async ({ request }) => {
      const body = (await request.json()) as { query: string; read_only: boolean }
      queries.push(body)
      return HttpResponse.json(rowsFor(body.query))
    })
  )
  return queries
}

const send = (intent: ReturnType<typeof queryIntent>) =>
  answerSparkIntent({ query: 'select 1', intent: intent.id, args: intent.args })

describe('answerSparkIntent', () => {
  beforeEach(() => {
    vi.stubEnv('STUDIO_SPARK_URL', SPARK_URL)
    vi.stubEnv('STUDIO_SPARK_SERVICE_KEY', 'service-key')
  })
  afterEach(() => vi.unstubAllEnvs())

  it('leaves a request to pg-meta when the project is not Spark or the intent is unknown', async () => {
    expect(await answerSparkIntent({ query: 'select 1', intent: 'cron.jobs' })).toBeUndefined()
    expect(await answerSparkIntent({ query: 'select 1' })).toBeUndefined()
    vi.stubEnv('STUDIO_SPARK_URL', '')
    expect(await send(queryIntent('schemas.list', {}))).toBeUndefined()
  })

  it('answers the table editor: entities, the table definition and its constraints', async () => {
    mockSpark(() => [])
    const [entities] = (await send(
      queryIntent('entities.list', {
        schemas: ['public'],
        sort: 'alphabetical',
        filterTypes: ['r', 'v', 'm', 'f', 'p'],
        limit: 100,
        page: 0,
      })
    )) as [{ data: { entities: { id: number; name: string }[]; count: number } }]
    expect(entities.data).toEqual({
      entities: [
        expect.objectContaining({ id: todosId, name: 'todos', type: 'r', rls_enabled: true }),
      ],
      count: 1,
    })

    const [definition] = (await send(queryIntent('entity.definition', { id: todosId }))) as [
      { entity: Record<string, unknown> },
    ]
    expect(definition.entity).toMatchObject({
      entity_type: 'r',
      schema: 'public',
      name: 'todos',
      primary_keys: [{ name: 'id', table_id: todosId }],
      relationships: [
        expect.objectContaining({
          source_column_name: 'user_id',
          target_table_schema: 'auth',
          deletion_action: 'c',
        }),
      ],
      unique_indexes: [],
    })
    expect(
      (definition.entity.columns as { name: string; format: string }[]).map((c) => [
        c.name,
        c.format,
      ])
    ).toEqual([
      ['id', 'int8'],
      ['user_id', 'uuid'],
      ['title', 'text'],
      ['done', 'bool'],
    ])

    expect(await send(queryIntent('table-constraints.list', { id: todosId }))).toEqual([
      expect.objectContaining({ name: 'todos_pkey', type: 'p' }),
      expect.objectContaining({ name: 'todos_user_id_fkey', type: 'f' }),
    ])
  })

  it('reads rows with Spark running only the plain select, then coerces and truncates', async () => {
    const queries = mockSpark(() => [
      { id: 1, user_id: 'u1', title: 'x'.repeat(12), done: 0 },
      { id: 2, user_id: 'u1', title: 'short', done: 1 },
    ])
    const rows = await send(
      queryIntent('rows.read', {
        schema: 'public',
        name: 'todos',
        filters: [{ column: 'title', operator: '~~*', value: 'x' }],
        page: 1,
        limit: 100,
        maxCharacters: 10,
      })
    )
    expect(queries).toHaveLength(1)
    expect(queries[0].read_only).toBe(true)
    expect(queries[0].query).toMatch(
      /^select \* from public\.todos where title::text ~~\* '%x%' order by todos\.id asc/i
    )
    expect(queries[0].query).not.toMatch(/octet_length|_base_query/)
    expect(rows).toEqual([
      { id: 1, user_id: 'u1', title: `${'x'.repeat(10)}...`, done: false },
      { id: 2, user_id: 'u1', title: 'short', done: true },
    ])
  })

  it('counts rows exactly and lists tables with row counts, policies and migrations', async () => {
    mockSpark((sql) => (/count/i.test(sql) ? [{ count: 3 }] : []))
    expect(await send(queryIntent('rows.count', { schema: 'public', name: 'todos' }))).toEqual([
      { count: 3, is_estimate: false },
    ])

    const tables = (await send(queryIntent('tables.list', { includedSchemas: ['public'] }))) as {
      name: string
      live_rows_estimate: number
    }[]
    expect(tables.map((t) => [t.name, t.live_rows_estimate])).toEqual([['todos', 3]])

    expect(await send(queryIntent('policies.list', { includedSchemas: ['public'] }))).toEqual([
      expect.objectContaining({
        table: 'todos',
        table_id: todosId,
        command: 'ALL',
        roles: ['authenticated'],
        definition: '(auth.uid() = user_id)',
      }),
    ])

    const migrations = (await send(queryIntent('migrations.list', {}))) as { version: string }[]
    expect(migrations.map((m) => m.version)).toEqual(['20260102000000', '20260101000000'])
  })
})
