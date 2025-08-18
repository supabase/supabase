import dayjs from 'dayjs'
import { parseQuery } from 'libpg-query'
import { compact } from 'lodash'
import { z } from 'zod'
import { PostgresColumn, PostgresTable } from './types'

const NameDefinition = z.union([
  z.object({
    sval: z.string(),
  }),
  z.object({
    str: z.string(),
  }),
])

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
            String: NameDefinition,
          })
        )
        .optional(),
      pk_attrs: z.array(
        z.object({
          String: NameDefinition,
        })
      ),
    }),
  ]),
})

const columnDefinitionSchema = z.object({
  ColumnDef: z.object({
    colname: z.string(),
    typeName: z.object({
      names: z.array(z.object({ String: NameDefinition })),
    }),
    constraints: z.array(constraintDefinitionSchema).optional(),
  }),
})

const tableDefinitionSchema = z.object({
  CreateStmt: z
    .object({
      relation: z.object({
        relname: z.string(),
      }),
      tableElts: z.array(z.union([columnDefinitionSchema, constraintDefinitionSchema])),
    })
    // the optional() allows other types of statements, but only CreateStmt will be type-safe, we
    // don't care for the other ones.
    .optional(),
})

const parseQueryResultSchema = z.object({
  stmts: z.array(
    z.object({
      stmt: tableDefinitionSchema,
    })
  ),
})

const extractNameDefinition = (obj: z.infer<typeof NameDefinition>) => {
  if ('sval' in obj) {
    return obj?.sval
  }
  if ('str' in obj) {
    return obj?.str
  }
  return null
}

/**
 * Parses SQL into tables compatible with the existing schema visualizer.
 *
 * TODO: consider running in WebWorker
 */
export async function parseTables(sql: string) {
  // Parse SQL using the real Postgres parser (compiled to WASM)

  const result = await parseQuery(sql)
  const parsedSql = parseQueryResultSchema.safeParse(result)

  if (!parsedSql.success) {
    console.log(parsedSql.error)
    return []
  }

  // This code generates all columns with their constraints
  const pgTables: PostgresTable[] = compact(
    parsedSql.data.stmts.map(({ stmt }) => {
      if (!stmt.CreateStmt) {
        return
      }

      const statement = stmt.CreateStmt

      const columns = compact(
        statement.tableElts.map((column) => {
          if ('ColumnDef' in column) {
            const format = compact(
              column.ColumnDef.typeName.names
                .map((name) => extractNameDefinition(name.String))
                .filter((str) => str !== 'pg_catalog' || !!str)
            )[0]

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
              const targetColumn = compact(
                found.Constraint.pk_attrs.map((name) => extractNameDefinition(name.String))
              )[0]

              if (!targetColumn) {
                return null
              }

              return {
                id: `${statement.relation.relname}_${column.ColumnDef.colname}_${found.Constraint.pktable.relname}_${targetColumn}`,
                source_table_name: statement.relation.relname,
                source_column_name: column.ColumnDef.colname,
                target_table_name: found.Constraint.pktable.relname,
                target_column_name: targetColumn,
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
              return compact(
                constraint.Constraint.fk_attrs.map((attr, index) => {
                  const attrString = extractNameDefinition(attr.String)

                  const pgAttrString = extractNameDefinition(pgAttrs[index].String)

                  if (!attrString || !pgAttrString) {
                    return null
                  }

                  return {
                    id: `${statement.relation.relname}_${attrString}_${pkTable.relname}_${pgAttrString}`,
                    source_table_name: statement.relation.relname,
                    source_column_name: attrString,
                    target_table_name: pkTable.relname,
                    target_column_name: pgAttrString,
                  }
                })
              )
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
  )

  return pgTables
}

export function timeAgo(date: string) {
  const createdAt = dayjs(date)
  const currentTime = dayjs()
  const timeDifference = currentTime.diff(createdAt, 'seconds') // Time difference in seconds

  if (timeDifference < 60) {
    // Less than 1 minute
    return 'just now'
  } else if (timeDifference < 3600) {
    // Less than 1 hour
    return `${Math.floor(timeDifference / 60)} minutes ago`
  } else if (timeDifference < 86400) {
    // Less than 1 day (24 hours)
    return `${Math.floor(timeDifference / 3600)} hours ago`
  } else {
    // More than 1 day
    return createdAt.format('MMM DD, YYYY')
  }
}

export function slugify(str: string) {
  return str
    .toLowerCase() // Convert to lowercase
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^\w-]+/g, '') // Remove non-word characters except hyphens
    .replace(/--+/g, '-') // Replace multiple consecutive hyphens with a single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading and trailing hyphens
}
