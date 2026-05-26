import { z } from 'zod'

import { DEFAULT_SYSTEM_SCHEMAS } from './constants'
import { filterByList } from './helpers'
import { ident, keyword, literal, rawSql, safeSql, type SafeSqlFragment } from './pg-format'
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
  // Optional at the type level for compatibility with column data sourced from the legacy
  // `/platform/pg-meta/{ref}/tables` REST endpoint, which doesn't include this field. The pg-meta
  // SQL itself always returns format_schema.
  format_schema: z.string().optional(),
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
  sql: SafeSqlFragment
  zod: typeof pgColumnArrayZod
} {
  let sql = safeSql`
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
    sql = safeSql`${sql} and schema ${filter}`
  }
  if (tableId !== undefined) {
    sql = safeSql`${sql} and table_id = ${literal(tableId)} `
  }
  if (limit) {
    sql = safeSql`${sql} limit ${literal(limit)}`
  }
  if (offset) {
    sql = safeSql`${sql} offset ${literal(offset)}`
  }
  return {
    sql,
    zod: pgColumnArrayZod,
  }
}

type ColumnIdentifier = Pick<PGColumn, 'id'> | Pick<PGColumn, 'name' | 'schema' | 'table'>

function getIdentifierWhereClause(identifier: ColumnIdentifier): SafeSqlFragment {
  if ('id' in identifier && identifier.id) {
    return safeSql`${ident('id')} = ${literal(identifier.id)}`
  } else if ('name' in identifier && identifier.name && identifier.schema && identifier.table) {
    return safeSql`schema = ${literal(identifier.schema)} AND ${ident('table')} = ${literal(identifier.table)} AND name = ${literal(identifier.name)}`
  }
  throw new Error('Must provide either id or schema, name and table')
}

function retrieve(identifier: ColumnIdentifier): {
  sql: SafeSqlFragment
  zod: typeof pgColumnOptionalZod
} {
  const sql = safeSql`WITH columns AS (${COLUMNS_SQL}) SELECT * FROM columns WHERE ${getIdentifierWhereClause(identifier)};`
  return {
    sql,
    zod: pgColumnOptionalZod,
  }
}

export type ColumnTypeRef = {
  schema?: string
  name: string
  isArray?: boolean
}

export interface CreateOptionsBase {
  schema: string
  table: string
  name: string
  type: ColumnTypeRef
  is_identity?: boolean
  identity_generation?: 'BY DEFAULT' | 'ALWAYS'
  is_nullable?: boolean
  is_primary_key?: boolean
  is_unique?: boolean
  comment?: string
  check?: string
  no_transaction?: boolean
}

type CreateOptionsDefaultExpression = {
  default_value_format: 'expression'
  default_value: SafeSqlFragment
} & CreateOptionsBase

type CreateOptionsNotDefaultExpression = {
  default_value_format?: 'literal'
  default_value?: unknown
} & CreateOptionsBase

type CreateOptions = CreateOptionsDefaultExpression | CreateOptionsNotDefaultExpression

function create({
  schema,
  table,
  name,
  type,
  is_identity = false,
  identity_generation = 'BY DEFAULT',
  is_nullable,
  is_primary_key = false,
  is_unique = false,
  comment,
  check,
  no_transaction = false,
  ...defaultOptions
}: CreateOptions): { sql: SafeSqlFragment } {
  let defaultValueClause: SafeSqlFragment = safeSql``
  if (is_identity) {
    if (defaultOptions.default_value !== undefined) {
      throw new Error('Columns cannot both be identity and have a default value')
    }

    defaultValueClause = safeSql`GENERATED ${keyword(identity_generation)} AS IDENTITY`
  } else {
    if (defaultOptions.default_value === undefined) {
      // skip
    } else if (defaultOptions.default_value_format === 'expression') {
      defaultValueClause = safeSql`DEFAULT ${defaultOptions.default_value}`
    } else {
      defaultValueClause = safeSql`DEFAULT ${literal(defaultOptions.default_value)}`
    }
  }

  const isNullableClause: SafeSqlFragment =
    is_nullable === undefined ? safeSql`` : is_nullable ? safeSql`NULL` : safeSql`NOT NULL`
  const isPrimaryKeyClause: SafeSqlFragment = is_primary_key ? safeSql`PRIMARY KEY` : safeSql``
  const isUniqueClause: SafeSqlFragment = is_unique ? safeSql`UNIQUE` : safeSql``
  const checkSql: SafeSqlFragment =
    check === undefined ? safeSql`` : safeSql`CHECK (${rawSql(check)})`
  const commentSql: SafeSqlFragment =
    comment === undefined
      ? safeSql``
      : safeSql`COMMENT ON COLUMN ${ident(schema)}.${ident(table)}.${ident(name)} IS ${literal(comment)}`

  const sql = safeSql`
  ALTER TABLE ${ident(schema)}.${ident(table)} ADD COLUMN ${ident(name)} ${typeIdent(type)}
    ${defaultValueClause}
    ${isNullableClause}
    ${isPrimaryKeyClause}
    ${isUniqueClause}
    ${checkSql};
  ${commentSql};`

  if (no_transaction) {
    return { sql }
  }

  return {
    sql: safeSql`
  BEGIN;
    ${sql};
  COMMIT;`,
  }
}

function typeIdent(type: ColumnTypeRef): SafeSqlFragment {
  const base =
    type.schema !== undefined
      ? safeSql`${ident(type.schema)}.${ident(type.name)}`
      : ident(type.name)
  return type.isArray ? safeSql`${base}[]` : base
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
    type?: ColumnTypeRef
    drop_default?: boolean
    default_value?: any
    default_value_format?: 'expression' | 'literal'
    is_identity?: boolean
    identity_generation?: 'BY DEFAULT' | 'ALWAYS'
    is_nullable?: boolean
    is_unique?: boolean
    comment?: string | null
    check?: SafeSqlFragment | null
  }
): { sql: SafeSqlFragment } {
  const nameSql: SafeSqlFragment =
    name === undefined || name === old.name
      ? safeSql``
      : safeSql`ALTER TABLE ${ident(old.schema)}.${ident(old.table)} RENAME COLUMN ${ident(old.name)} TO ${ident(name)};`
  // We use USING to allow implicit conversion of incompatible types (e.g. int4 -> text).
  const typeSql: SafeSqlFragment =
    type === undefined
      ? safeSql``
      : safeSql`ALTER TABLE ${ident(old.schema)}.${ident(old.table)} ALTER COLUMN ${ident(old.name)} SET DATA TYPE ${typeIdent(type)} USING ${ident(old.name)}::${typeIdent(type)};`

  let defaultValueSql: SafeSqlFragment
  if (drop_default) {
    defaultValueSql = safeSql`ALTER TABLE ${ident(old.schema)}.${ident(old.table)} ALTER COLUMN ${ident(old.name)} DROP DEFAULT;`
  } else if (default_value === undefined) {
    defaultValueSql = safeSql``
  } else {
    const defaultValue: SafeSqlFragment =
      default_value_format === 'expression' ? default_value : literal(default_value)
    defaultValueSql = safeSql`ALTER TABLE ${ident(old.schema)}.${ident(old.table)} ALTER COLUMN ${ident(old.name)} SET DEFAULT ${defaultValue};`
  }
  // What identitySql does vary depending on the old and new values of
  // is_identity and identity_generation.
  //
  // | is_identity: old \ new | undefined          | true               | false          |
  // |------------------------+--------------------+--------------------+----------------|
  // | true                   | maybe set identity | maybe set identity | drop if exists |
  // |------------------------+--------------------+--------------------+----------------|
  // | false                  | -                  | add identity       | drop if exists |
  const alterColumnPrefix = safeSql`ALTER TABLE ${ident(old.schema)}.${ident(old.table)} ALTER COLUMN ${ident(old.name)}`
  let identitySql: SafeSqlFragment
  if (is_identity === false) {
    identitySql = safeSql`${alterColumnPrefix} DROP IDENTITY IF EXISTS;`
  } else if (old.is_identity === true) {
    if (identity_generation === undefined) {
      identitySql = safeSql``
    } else {
      identitySql = safeSql`${alterColumnPrefix} SET GENERATED ${keyword(identity_generation)};`
    }
  } else if (is_identity === undefined) {
    identitySql = safeSql``
  } else {
    identitySql = safeSql`${alterColumnPrefix} ADD GENERATED ${keyword(identity_generation)} AS IDENTITY;`
  }
  let isNullableSql: SafeSqlFragment
  if (is_nullable === undefined) {
    isNullableSql = safeSql``
  } else {
    isNullableSql = is_nullable
      ? safeSql`ALTER TABLE ${ident(old.schema)}.${ident(old.table)} ALTER COLUMN ${ident(old.name)} DROP NOT NULL;`
      : safeSql`ALTER TABLE ${ident(old.schema)}.${ident(old.table)} ALTER COLUMN ${ident(old.name)} SET NOT NULL;`
  }
  let isUniqueSql: SafeSqlFragment = safeSql``
  if (old.is_unique === true && is_unique === false) {
    isUniqueSql = safeSql`
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
    EXECUTE ${literal(`ALTER TABLE ${ident(old.schema)}.${ident(old.table)} DROP CONSTRAINT `)} || quote_ident(r.conname);
  END LOOP;
END
$$;`
  } else if (old.is_unique === false && is_unique === true) {
    isUniqueSql = safeSql`ALTER TABLE ${ident(old.schema)}.${ident(old.table)} ADD UNIQUE (${ident(old.name)});`
  }
  const commentSql: SafeSqlFragment =
    comment === undefined
      ? safeSql``
      : safeSql`COMMENT ON COLUMN ${ident(old.schema)}.${ident(old.table)}.${ident(old.name)} IS ${literal(comment)};`

  let checkSql: SafeSqlFragment = safeSql``
  if (check !== undefined) {
    const addCheckSql: SafeSqlFragment =
      check !== null
        ? safeSql`
  ALTER TABLE ${ident(old.schema)}.${ident(old.table)} ADD CONSTRAINT ${ident(`${old.table}_${old.name}_check`)} CHECK (${check});

  SELECT conkey into v_conkey FROM pg_constraint WHERE conname = ${literal(`${old.table}_${old.name}_check`)};

  ASSERT v_conkey IS NOT NULL, 'error creating column constraint: check condition must refer to this column';
  ASSERT cardinality(v_conkey) = 1, 'error creating column constraint: check condition cannot refer to multiple columns';
  ASSERT v_conkey[1] = ${literal(old.ordinal_position)}, 'error creating column constraint: check condition cannot refer to other columns';`
        : safeSql``
    checkSql = safeSql`
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
    EXECUTE format('ALTER TABLE ${ident(old.schema)}.${ident(old.table)} DROP CONSTRAINT %I', v_conname);
  END IF;
  ${addCheckSql}
END
$$;`
  }

  // TODO: Can't set default if column is previously identity even if
  // is_identity: false. Must do two separate PATCHes (once to drop identity
  // and another to set default).
  // NOTE: nameSql must be last. defaultValueSql must be after typeSql.
  // identitySql must be after isNullableSql.
  const sql = safeSql`
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
): { sql: SafeSqlFragment } {
  const sql = safeSql`ALTER TABLE ${ident(column.schema)}.${ident(column.table)} DROP COLUMN ${ident(column.name)} ${cascade ? safeSql`CASCADE` : safeSql`RESTRICT`};`
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
