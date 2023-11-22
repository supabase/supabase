import { parseQuery } from '@gregnr/libpg-query'
import { compact } from 'lodash'
import { z } from 'zod'

import { PostgresColumn, PostgresTable } from './types'

const constraintDefinitionSchema = z.object({
  Constraint: z.discriminatedUnion('contype', [
    z
      .object({
        contype: z.literal('CONSTR_PRIMARY'),
        keys: z
          .array(
            z.object({
              String: z.object({
                sval: z.string(),
              }),
            })
          )
          .optional(),
      })
      .passthrough(),
    z.object({
      contype: z.literal('CONSTR_IDENTITY'),
    }),
    z.object({
      contype: z.literal('CONSTR_NOTNULL'),
    }),
    z.object({
      contype: z.literal('CONSTR_UNIQUE'),
    }),
    z.object({
      contype: z.literal('CONSTR_DEFAULT'),
    }),
    z.object({
      contype: z.literal('CONSTR_FOREIGN'),
      pktable: z.object({
        relname: z.string(),
      }),
      fk_attrs: z
        .array(
          z.object({
            String: z.object({
              sval: z.string(),
            }),
          })
        )
        .optional(),
      pk_attrs: z.array(
        z.object({
          String: z.object({
            sval: z.string(),
          }),
        })
      ),
    }),
  ]),
})

const columnDefinitionSchema = z.object({
  ColumnDef: z.object({
    colname: z.string(),
    typeName: z.object({
      names: z.array(
        z.object({
          String: z.object({
            sval: z.string(),
          }),
        })
      ),
    }),
    constraints: z.array(constraintDefinitionSchema).optional(),
  }),
})

const tableDefinitionSchema = z.object({
  CreateStmt: z.object({
    relation: z.object({
      relname: z.string(),
    }),
    tableElts: z.array(z.union([columnDefinitionSchema, constraintDefinitionSchema])),
  }),
})

const parseQueryResultSchema = z.object({
  stmts: z.array(
    z.object({
      stmt: tableDefinitionSchema,
    })
  ),
})

/**
 * Parses SQL into tables compatible with the existing schema visualizer.
 *
 * TODO: consider running in WebWorker
 */
export async function parseTables(sql: string) {
  // Parse SQL using the real Postgres parser (compiled to WASM)
  // See: https://github.com/pyramation/libpg-query-node/pull/34

  const result = await parseQuery(sql)

  const parsedSql = parseQueryResultSchema.safeParse(result)
  if (!parsedSql.success) {
    console.log(parsedSql.error)
    return []
  }

  // This code generates all columns with their constraints
  const pgTables: PostgresTable[] = parsedSql.data.stmts
    .filter(({ stmt }) => 'CreateStmt' in stmt)
    .map(({ stmt }) => {
      const statement = stmt.CreateStmt

      const columns = compact(
        statement.tableElts.map((column) => {
          if ('ColumnDef' in column) {
            const format = column.ColumnDef.typeName.names.find(
              ({ String: { sval } }) => sval !== 'pg_catalog'
            )?.String.sval

            if (!format) {
              return undefined
            }
            const constraints = (column.ColumnDef.constraints || []).map(
              (c) => c.Constraint.contype
            )

            const result: PostgresColumn = {
              name: column.ColumnDef.colname,
              format: format,
              id: column.ColumnDef.colname,
              is_nullable: !constraints.includes('CONSTR_NOTNULL'),
              is_unique: constraints.includes('CONSTR_UNIQUE'),
              is_identity: constraints.includes('CONSTR_IDENTITY'),
            }

            return result
          }
        })
      )

      // This code processes user_id bigint references users (id) SQL.
      const columnRelationships = compact(
        statement.tableElts.map((column) => {
          if ('ColumnDef' in column) {
            const found = (column.ColumnDef.constraints || []).find(
              (c) => c.Constraint.contype === 'CONSTR_FOREIGN'
            )

            if (found && found.Constraint.contype === 'CONSTR_FOREIGN') {
              return {
                id: `${statement.relation.relname}_${column.ColumnDef.colname}_${found.Constraint.pktable.relname}_${found.Constraint.pk_attrs[0].String.sval}`,
                source_table_name: statement.relation.relname,
                source_column_name: column.ColumnDef.colname,
                target_table_name: found.Constraint.pktable.relname,
                target_column_name: found.Constraint.pk_attrs[0].String.sval,
              }
            }
          }
        })
      )

      // This code processes foreign key (tweet_user_username, tweet_content) references tweets (user_username, content) SQL. It supports composite keys between two tables
      const tableRelationships = compact(
        statement.tableElts.flatMap((constraint) => {
          if ('Constraint' in constraint) {
            if (
              constraint.Constraint.contype === 'CONSTR_FOREIGN' &&
              constraint.Constraint.fk_attrs &&
              constraint.Constraint.pk_attrs.length === constraint.Constraint.fk_attrs.length
            ) {
              const pkTable = constraint.Constraint.pktable
              const pgAttrs = constraint.Constraint.pk_attrs
              return constraint.Constraint.fk_attrs.map((attr, index) => {
                return {
                  id: `${statement.relation.relname}_${attr.String.sval}_${pkTable.relname}_${pgAttrs[index].String.sval}`,
                  source_table_name: statement.relation.relname,
                  source_column_name: attr.String.sval,
                  target_table_name: pkTable.relname,
                  target_column_name: pgAttrs[index].String.sval,
                }
              })
            }
          }
        })
      )

      const columnPrimaryKeys = compact(
        statement.tableElts.map((column) => {
          if ('ColumnDef' in column) {
            const constraint = (column.ColumnDef.constraints || []).find(
              (c) => c.Constraint.contype === 'CONSTR_PRIMARY'
            )
            if (constraint) {
              return { name: column.ColumnDef.colname }
            }
          }
        })
      )

      // This code processes primary key (user_username, tweet_user_username, tweet_content) SQL.
      const tablePrimaryKeys = compact(
        statement.tableElts.flatMap((constraint) => {
          if ('Constraint' in constraint) {
            if (constraint.Constraint.contype === 'CONSTR_PRIMARY' && constraint.Constraint.keys) {
              return constraint.Constraint.keys.map((key) => ({ name: key.String.sval }))
            }
            return undefined
          }
        })
      )
      const table: PostgresTable = {
        name: statement.relation.relname,
        columns,
        id: statement.relation.relname,
        primary_keys: [...columnPrimaryKeys, ...tablePrimaryKeys],
        relationships: [...columnRelationships, ...tableRelationships],
      }

      return table
    })

  return pgTables
}
