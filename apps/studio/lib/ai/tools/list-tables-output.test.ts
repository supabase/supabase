import type { PGForeignTable, PGMaterializedView, PGTable, PGView } from '@supabase/pg-meta'
import { describe, expect, it } from 'vitest'

import { listTablesOutputSchema, toListTablesOutput } from './list-tables-output'

const column = (overrides: Partial<NonNullable<PGTable['columns']>[number]> = {}) => ({
  id: '1.1',
  table_id: 1,
  schema: 'public',
  table: 'todos',
  name: 'id',
  ordinal_position: 1,
  data_type: 'bigint',
  format: 'int8',
  is_identity: false,
  identity_generation: null,
  is_generated: false,
  is_nullable: false,
  is_updatable: true,
  is_unique: false,
  check: null,
  default_value: null,
  enums: [],
  comment: null,
  ...overrides,
})

const table = (overrides: Partial<PGTable> = {}): PGTable => ({
  id: 1,
  schema: 'public',
  name: 'todos',
  rls_enabled: true,
  rls_forced: false,
  replica_identity: 'DEFAULT',
  bytes: 8192,
  size: '8 kB',
  live_rows_estimate: 3,
  dead_rows_estimate: 0,
  comment: null,
  primary_keys: [{ table_id: 1, name: 'id', schema: 'public', table_name: 'todos' }],
  relationships: [],
  ...overrides,
})

const tablesOnly = (tables: PGTable[], verbose: boolean) =>
  toListTablesOutput({ tables, views: [], materializedViews: [], foreignTables: [] }, verbose)

describe('toListTablesOutput', () => {
  it('returns a compact summary without details', () => {
    const output = tablesOnly([table({ columns: [column()], comment: 'Things to do' })], false)

    expect(output).toEqual({
      tables: [{ name: 'public.todos', rls_enabled: true, rows: 3, comment: 'Things to do' }],
    })
  })

  it('omits a null comment', () => {
    const [summary] = tablesOnly([table()], false).tables
    expect(summary).not.toHaveProperty('comment')
  })

  it('includes columns, primary keys and foreign keys when verbose', () => {
    const output = tablesOnly(
      [
        table({
          columns: [
            column({
              is_identity: true,
              identity_generation: 'ALWAYS',
              is_unique: true,
              is_updatable: false,
            }),
            column({
              name: 'status',
              data_type: 'USER-DEFINED',
              format: 'status',
              is_nullable: true,
              default_value: "'open'::status",
              enums: ['open', 'done'],
              check: 'status <> ``',
              comment: 'Where it stands',
            }),
          ],
          relationships: [
            {
              id: 10,
              constraint_name: 'todos_owner_fkey',
              source_schema: 'public',
              source_table_name: 'todos',
              source_column_name: 'owner_id',
              target_table_schema: 'auth',
              target_table_name: 'users',
              target_column_name: 'id',
            },
          ],
        }),
      ],
      true
    )

    expect(output.tables[0]).toEqual({
      name: 'public.todos',
      rls_enabled: true,
      rows: 3,
      columns: [
        {
          name: 'id',
          data_type: 'bigint',
          format: 'int8',
          options: ['identity', 'unique'],
          identity_generation: 'ALWAYS',
        },
        {
          name: 'status',
          data_type: 'USER-DEFINED',
          format: 'status',
          options: ['nullable', 'updatable'],
          default_value: "'open'::status",
          enums: ['open', 'done'],
          check: 'status <> ``',
          comment: 'Where it stands',
        },
      ],
      primary_keys: ['id'],
      foreign_key_constraints: [
        {
          name: 'todos_owner_fkey',
          source_table: 'public.todos',
          source_columns: ['owner_id'],
          target_table: 'auth.users',
          target_columns: ['id'],
        },
      ],
    })
  })

  it('lists the generated option and groups a composite foreign key into one constraint', () => {
    const relationship = {
      id: 11,
      constraint_name: 'composite_fkey',
      source_schema: 'public',
      source_table_name: 'todos',
      target_table_schema: 'public',
      target_table_name: 'lists',
    }
    const [verbose] = tablesOnly(
      [
        table({
          columns: [column({ is_generated: true })],
          relationships: [
            { ...relationship, source_column_name: 'a', target_column_name: 'x' },
            { ...relationship, source_column_name: 'b', target_column_name: 'y' },
          ],
        }),
      ],
      true
    ).tables

    expect(verbose.columns?.[0].options).toEqual(['generated', 'updatable'])
    expect(verbose.foreign_key_constraints).toEqual([
      {
        name: 'composite_fkey',
        source_table: 'public.todos',
        source_columns: ['a', 'b'],
        target_table: 'public.lists',
        target_columns: ['x', 'y'],
      },
    ])
  })

  it('returns null columns and no foreign keys when a verbose row has none', () => {
    const [verbose] = tablesOnly([table()], true).tables
    expect(verbose.columns).toBeNull()
    expect(verbose).not.toHaveProperty('foreign_key_constraints')
  })

  it('produces output the output schema accepts', () => {
    const output = tablesOnly([table({ columns: [column()] })], true)
    expect(listTablesOutputSchema.safeParse(output).success).toBe(true)
  })
  describe('non-table relations', () => {
    const view: PGView = {
      id: 2,
      schema: 'public',
      name: 'active_todos',
      is_updatable: false,
      comment: 'Open items',
      columns: [column({ is_nullable: true })],
    }
    const materializedView: PGMaterializedView = {
      id: 3,
      schema: 'analytics',
      name: 'daily',
      is_populated: true,
      comment: null,
    }
    const foreignTable: PGForeignTable = {
      id: 4,
      schema: 'public',
      name: 'remote',
      comment: null,
      foreign_server_name: 's',
      foreign_data_wrapper_name: 'w',
      foreign_data_wrapper_handler: 'h',
    }
    const relations = {
      tables: [],
      views: [view],
      materializedViews: [materializedView],
      foreignTables: [foreignTable],
    }

    it('tags each relation with its type in the compact summary', () => {
      expect(toListTablesOutput(relations, false)).toEqual({
        tables: [
          {
            name: 'public.active_todos',
            type: 'view',
            rls_enabled: false,
            rows: null,
            comment: 'Open items',
          },
          {
            name: 'analytics.daily',
            type: 'materialized_view',
            rls_enabled: false,
            rows: null,
          },
          { name: 'public.remote', type: 'foreign_table', rls_enabled: false, rows: null },
        ],
      })
    })

    it('adds columns and empty primary keys when verbose', () => {
      const [verboseView, verboseMaterialized] = toListTablesOutput(relations, true).tables

      expect(verboseView.columns).toEqual([
        {
          name: 'id',
          data_type: 'bigint',
          format: 'int8',
          options: ['nullable', 'updatable'],
        },
      ])
      expect(verboseView.primary_keys).toEqual([])
      expect(verboseMaterialized.columns).toBeNull()
    })

    it('produces output the output schema accepts', () => {
      expect(listTablesOutputSchema.safeParse(toListTablesOutput(relations, true)).success).toBe(
        true
      )
    })
  })
})
