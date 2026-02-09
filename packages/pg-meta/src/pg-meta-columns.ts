import { z } from 'zod'

import { DEFAULT_SYSTEM_SCHEMAS } from './constants'
import { filterByList } from './helpers'
import { ident, literal } from './pg-format'
import { COLUMNS_SQL } from './sql/columns'

const pgColumnZod = z.object({
  id: z.string(),
  table_id: z.number(),
  schema: z.string(),
  table: z.string(),
  name: z.string(),
  ordinal_position: z.number(),
  data_type: z.string(),
  format: z.string(),
  is_identity: z.boolean(),
  identity_generation: z.string().nullable(),
  is_generated: z.boolean(),
  is_nullable: z.boolean(),
  is_updatable: z.boolean(),
  is_unique: z.boolean(),
  check: z.string().nullable(),
  default_value: z.any().nullable(),
  enums: z.array(z.string()),
  comment: z.string().nullable(),
})

export const pgColumnArrayZod = z.array(pgColumnZod)
const pgColumnOptionalZod = z.optional(pgColumnZod)

export type PGColumn = z.infer<typeof pgColumnZod>

function list({
  tableId,
  includeSystemSchemas = false,
  includedSchemas,
  excludedSchemas,
  limit,
  offset,
}: {
  tableId?: number
  includeSystemSchemas?: boolean
  includedSchemas?: string[]
  excludedSchemas?: string[]
  limit?: number
  offset?: number
} = {}): {
  sql: string
  zod: typeof pgColumnArrayZod
} {
  let sql = `
with
  columns as (${COLUMNS_SQL})
select
  *
from
  columns
where
 true
`

  const filter = filterByList(
    includedSchemas,
    excludedSchemas,
    !includeSystemSchemas ? DEFAULT_SYSTEM_SCHEMAS : undefined
  )

  if (filter) {
    sql += ` and schema ${filter}`
  }
  if (tableId !== undefined) {
    sql += ` and table_id = ${literal(tableId)} `
  }
  if (limit) {
    sql = `${sql} limit ${limit}`
  }
  if (offset) {
    sql = `${sql} offset ${offset}`
  }
  return {
    sql,
    zod: pgColumnArrayZod,
  }
}

type ColumnIdentifier = Pick<PGColumn, 'id'> | Pick<PGColumn, 'name' | 'schema' | 'table'>

function getIdentifierWhereClause(identifier: ColumnIdentifier) {
  if ('id' in identifier && identifier.id) {
    return `${ident('id')} = ${literal(identifier.id)}`
  } else if ('name' in identifier && identifier.name && identifier.schema && identifier.table) {
    return `schema = ${literal(identifier.schema)} AND ${ident('table')} = ${literal(identifier.table)} AND name = ${literal(identifier.name)}`
  }
  throw new Error('Must provide either id or schema, name and table')
}

function retrieve(identifier: ColumnIdentifier): {
  sql: string
  zod: typeof pgColumnOptionalZod
} {
  const sql = `WITH columns AS (${COLUMNS_SQL}) SELECT * FROM columns WHERE ${getIdentifierWhereClause(identifier)};`
  return {
    sql,
    zod: pgColumnOptionalZod,
  }
}

function create({
  schema,
  table,
  name,
  type,
  default_value,
  default_value_format = 'literal',
  is_identity = false,
  identity_generation = 'BY DEFAULT',
  is_nullable,
  is_primary_key = false,
  is_unique = false,
  comment,
  check,
}: {
  schema: string
  table: string
  name: string
  type: string
  default_value?: any
  default_value_format?: 'expression' | 'literal'
  is_identity?: boolean
  identity_generation?: 'BY DEFAULT' | 'ALWAYS'
  is_nullable?: boolean
  is_primary_key?: boolean
  is_unique?: boolean
  comment?: string
  check?: string
}): { sql: string } {
  let defaultValueClause = ''
  if (is_identity) {
    if (default_value !== undefined) {
      throw new Error('Columns cannot both be identity and have a default value')
    }

    defaultValueClause = `GENERATED ${identity_generation} AS IDENTITY`
  } else {
    if (default_value === undefined) {
      // skip
    } else if (default_value_format === 'expression') {
      defaultValueClause = `DEFAULT ${default_value}`
    } else {
      defaultValueClause = `DEFAULT ${literal(default_value)}`
    }
  }

  let isNullableClause = ''
  if (is_nullable !== undefined) {
    isNullableClause = is_nullable ? 'NULL' : 'NOT NULL'
  }
  const isPrimaryKeyClause = is_primary_key ? 'PRIMARY KEY' : ''
  const isUniqueClause = is_unique ? 'UNIQUE' : ''
  const checkSql = check === undefined ? '' : `CHECK (${check})`
  const commentSql =
    comment === undefined
      ? ''
      : `COMMENT ON COLUMN ${ident(schema)}.${ident(table)}.${ident(name)} IS ${literal(comment)}`

  const sql = `
BEGIN;
  ALTER TABLE ${ident(schema)}.${ident(table)} ADD COLUMN ${ident(name)} ${typeIdent(type)}
    ${defaultValueClause}
    ${isNullableClause}
    ${isPrimaryKeyClause}
    ${isUniqueClause}
    ${checkSql};
  ${commentSql};
COMMIT;`

  return { sql }
}

// TODO: make this more robust - use type_id or type_schema + type_name instead of just type.
const typeIdent = (type: string) => {
  return type.endsWith('[]')
    ? `${ident(type.slice(0, -2))}[]`
    : type.includes('.')
      ? type
      : ident(type)
}

function update(
  old: Pick<
    PGColumn,
    'name' | 'schema' | 'table' | 'table_id' | 'ordinal_position' | 'is_identity' | 'is_unique'
  >,
  {
    name,
    type,
    drop_default = false,
    default_value,
    default_value_format = 'literal',
    is_identity,
    identity_generation = 'BY DEFAULT',
    is_nullable,
    is_unique,
    comment,
    check,
  }: {
    name?: string
    type?: string
    drop_default?: boolean
    default_value?: any
    default_value_format?: 'expression' | 'literal'
    is_identity?: boolean
    identity_generation?: 'BY DEFAULT' | 'ALWAYS'
    is_nullable?: boolean
    is_unique?: boolean
    comment?: string | null
    check?: string | null
  }
): { sql: string } {
  const nameSql =
    name === undefined || name === old.name
      ? ''
      : `ALTER TABLE ${ident(old.schema)}.${ident(old.table)} RENAME COLUMN ${ident(
          old.name
        )} TO ${ident(name)};`
  // We use USING to allow implicit conversion of incompatible types (e.g. int4 -> text).
  const typeSql =
    type === undefined
      ? ''
      : `ALTER TABLE ${ident(old.schema)}.${ident(old.table)} ALTER COLUMN ${ident(
          old.name
        )} SET DATA TYPE ${typeIdent(type)} USING ${ident(old.name)}::${typeIdent(type)};`

  let defaultValueSql: string
  if (drop_default) {
    defaultValueSql = `ALTER TABLE ${ident(old.schema)}.${ident(
      old.table
    )} ALTER COLUMN ${ident(old.name)} DROP DEFAULT;`
  } else if (default_value === undefined) {
    defaultValueSql = ''
  } else {
    const defaultValue =
      default_value_format === 'expression' ? default_value : literal(default_value)
    defaultValueSql = `ALTER TABLE ${ident(old.schema)}.${ident(
      old.table
    )} ALTER COLUMN ${ident(old.name)} SET DEFAULT ${defaultValue};`
  }
  // What identitySql does vary depending on the old and new values of
  // is_identity and identity_generation.
  //
  // | is_identity: old \ new | undefined          | true               | false          |
  // |------------------------+--------------------+--------------------+----------------|
  // | true                   | maybe set identity | maybe set identity | drop if exists |
  // |------------------------+--------------------+--------------------+----------------|
  // | false                  | -                  | add identity       | drop if exists |
  let identitySql = `ALTER TABLE ${ident(old.schema)}.${ident(old.table)} ALTER COLUMN ${ident(
    old.name
  )}`
  if (is_identity === false) {
    identitySql += ' DROP IDENTITY IF EXISTS;'
  } else if (old.is_identity === true) {
    if (identity_generation === undefined) {
      identitySql = ''
    } else {
      identitySql += ` SET GENERATED ${identity_generation};`
    }
  } else if (is_identity === undefined) {
    identitySql = ''
  } else {
    identitySql += ` ADD GENERATED ${identity_generation} AS IDENTITY;`
  }
  let isNullableSql: string
  if (is_nullable === undefined) {
    isNullableSql = ''
  } else {
    isNullableSql = is_nullable
      ? `ALTER TABLE ${ident(old.schema)}.${ident(old.table)} ALTER COLUMN ${ident(
          old.name
        )} DROP NOT NULL;`
      : `ALTER TABLE ${ident(old.schema)}.${ident(old.table)} ALTER COLUMN ${ident(
          old.name
        )} SET NOT NULL;`
  }
  let isUniqueSql = ''
  if (old.is_unique === true && is_unique === false) {
    isUniqueSql = `
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT conname FROM pg_constraint WHERE
      contype = 'u'
      AND cardinality(conkey) = 1
      AND conrelid = ${literal(old.table_id)}
      AND conkey[1] = ${literal(old.ordinal_position)}
  LOOP
    EXECUTE ${literal(
      `ALTER TABLE ${ident(old.schema)}.${ident(old.table)} DROP CONSTRAINT `
    )} || quote_ident(r.conname);
  END LOOP;
END
$$;
`
  } else if (old.is_unique === false && is_unique === true) {
    isUniqueSql = `ALTER TABLE ${ident(old.schema)}.${ident(old.table)} ADD UNIQUE (${ident(
      old.name
    )});`
  }
  const commentSql =
    comment === undefined
      ? ''
      : `COMMENT ON COLUMN ${ident(old.schema)}.${ident(old.table)}.${ident(
          old.name
        )} IS ${literal(comment)};`

  const checkSql =
    check === undefined
      ? ''
      : `
DO $$
DECLARE
  v_conname name;
  v_conkey int2[];
BEGIN
  SELECT conname into v_conname FROM pg_constraint WHERE
    contype = 'c'
    AND cardinality(conkey) = 1
    AND conrelid = ${literal(old.table_id)}
    AND conkey[1] = ${literal(old.ordinal_position)}
    ORDER BY oid asc
    LIMIT 1;

  IF v_conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE ${ident(old.schema)}.${ident(
      old.table
    )} DROP CONSTRAINT %I', v_conname);
  END IF;

  ${
    check !== null
      ? `
  ALTER TABLE ${ident(old.schema)}.${ident(old.table)} ADD CONSTRAINT ${ident(
    `${old.table}_${old.name}_check`
  )} CHECK (${check});

  SELECT conkey into v_conkey FROM pg_constraint WHERE conname = ${literal(
    `${old.table}_${old.name}_check`
  )};

  ASSERT v_conkey IS NOT NULL, 'error creating column constraint: check condition must refer to this column';
  ASSERT cardinality(v_conkey) = 1, 'error creating column constraint: check condition cannot refer to multiple columns';
  ASSERT v_conkey[1] = ${literal(
    old.ordinal_position
  )}, 'error creating column constraint: check condition cannot refer to other columns';
`
      : ''
  }
END
$$;
`

  // TODO: Can't set default if column is previously identity even if
  // is_identity: false. Must do two separate PATCHes (once to drop identity
  // and another to set default).
  // NOTE: nameSql must be last. defaultValueSql must be after typeSql.
  // identitySql must be after isNullableSql.
  const sql = `
BEGIN;
  ${isNullableSql}
  ${typeSql}
  ${defaultValueSql}
  ${identitySql}
  ${isUniqueSql}
  ${commentSql}
  ${checkSql}
  ${nameSql}
COMMIT;`

  return { sql }
}

function remove(
  column: Pick<PGColumn, 'name' | 'schema' | 'table'>,
  { cascade = false } = {}
): { sql: string } {
  const sql = `ALTER TABLE ${ident(column.schema)}.${ident(column.table)} DROP COLUMN ${ident(
    column.name
  )} ${cascade ? 'CASCADE' : 'RESTRICT'};`
  return { sql }
}

export default {
  list,
  retrieve,
  create,
  update,
  remove,
  zod: pgColumnZod,
}
