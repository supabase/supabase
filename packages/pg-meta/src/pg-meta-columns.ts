import { DEFAULT_SYSTEM_SCHEMAS } from './constants'
import { filterByList } from './helpers'
import { ident, literal } from './pg-format'
import { COLUMNS_SQL } from './sql/columns'
import { z } from 'zod'

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

type ColumnIdentifier =
  | Pick<PGColumn, 'id'>
  | {
      schema: string
      table: string
      name: string
    }

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
  table_id,
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
  table_id: number
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
  } else if (default_value !== undefined) {
    const formattedDefault =
      // Here we must wrap the litteral value into a String in case it receive a direct number to quote and escape
      // for the execute(format()) call. Maybe we should change the `default_value` to only accept a string instead ?
      default_value_format === 'expression' ? default_value : `'${literal(String(default_value))}'`
    defaultValueClause = `DEFAULT ${formattedDefault}`
  }

  const constraints: string[] = []
  if (is_nullable === false) constraints.push('NOT NULL')
  if (is_primary_key) constraints.push('PRIMARY KEY')
  if (is_unique) constraints.push('UNIQUE')
  if (check) constraints.push(`CHECK (${check})`)

  const sql = `
DO $$
DECLARE
  v_schema name;
  v_table name;
BEGIN
  SELECT n.nspname, c.relname INTO v_schema, v_table
  FROM pg_class c 
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.oid = ${literal(table_id)};

  IF v_schema IS NULL THEN
    RAISE EXCEPTION 'Table with id % not found', ${literal(table_id)};
  END IF;

  execute(format(
    'ALTER TABLE %I.%I ADD COLUMN %I %s ${defaultValueClause} ${constraints.join(' ')}',
    v_schema,
    v_table,
    ${literal(name)},
    ${literal(type)}
  ));
  
  ${comment ? `execute(format('COMMENT ON COLUMN %I.%I.%I IS %L', v_schema, v_table, ${literal(name)}, quote_ident(${literal(comment)})));` : ''}
END $$;`

  return { sql }
}

function update(
  id: string,
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
    comment?: string
    check?: string | null
  }
): { sql: string } {
  if (is_identity) {
    if (default_value !== undefined) {
      throw new Error('Columns cannot both be identity and have a default value')
    }
  }
  const sql = `
DO $$
DECLARE
  v_schema name;
  v_table name;
  v_column name;
  v_attnum int2;
  r record;
BEGIN
  WITH RECURSIVE column_info AS (
    ${COLUMNS_SQL}
  )
  SELECT 
    schema, 
    ${ident('table')},
    name,
    ordinal_position::int2
  INTO v_schema, v_table, v_column, v_attnum
  FROM column_info 
  WHERE ${getIdentifierWhereClause({ id })};

  IF v_schema IS NULL THEN
    RAISE EXCEPTION 'Column with id % not found', ${literal(id)};
  END IF;

  ${is_nullable !== undefined ? `execute(format('ALTER TABLE %I.%I ALTER COLUMN %I ${is_nullable ? 'DROP NOT NULL' : 'SET NOT NULL'}', v_schema, v_table, v_column));` : ''}

  ${type ? `execute(format('ALTER TABLE %I.%I ALTER COLUMN %I TYPE %I USING %I::%I', v_schema, v_table, v_column, ${literal(type)}, v_column, ${literal(type)}));` : ''}

  ${drop_default ? `execute(format('ALTER TABLE %I.%I ALTER COLUMN %I DROP DEFAULT', v_schema, v_table, v_column));` : ''}

  ${default_value !== undefined ? `execute(format('ALTER TABLE %I.%I ALTER COLUMN %I SET DEFAULT %s', v_schema, v_table, v_column, ${default_value_format === 'expression' ? default_value : literal(default_value)}));` : ''}
  
  ${is_identity !== undefined ? `execute(format('ALTER TABLE %I.%I ALTER COLUMN %I ${is_identity ? `ADD GENERATED ${identity_generation} AS IDENTITY` : 'DROP IDENTITY IF EXISTS'}', v_schema, v_table, v_column));` : ''}
  
  ${is_unique !== undefined ? `execute(format('ALTER TABLE %I.%I ${is_unique ? 'ADD UNIQUE' : 'DROP CONSTRAINT IF EXISTS %I_key'}', v_schema, v_table, ${is_unique ? `(${literal(name || 'v_column')})` : 'v_column'}));` : ''}

  ${comment !== undefined ? `execute(format('COMMENT ON COLUMN %I.%I.%I IS %L', v_schema, v_table, v_column, ${literal(comment)}));` : ''}

  ${
    check !== undefined
      ? `
    -- Drop existing check constraint if any
    FOR r IN (
      SELECT conname 
      FROM pg_constraint 
      WHERE conrelid = format('%I.%I', v_schema, v_table)::regclass 
      AND contype = 'c' 
      AND conkey = ARRAY[v_attnum]
    ) LOOP
      EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT %I', v_schema, v_table, r.conname);
    END LOOP;
    -- Create the new constraints if mentionned
    ${check !== null ? `execute(format('ALTER TABLE %I.%I ADD CONSTRAINT %I CHECK (%s)', v_schema, v_table, v_column || '_check', ${literal(check)}));` : ''}
  `
      : ''
  }
  ${name ? `execute(format('ALTER TABLE %I.%I RENAME COLUMN %I TO %I', v_schema, v_table, v_column, ${literal(name)}));` : ''}
END $$;`

  return { sql }
}

function remove(id: string, { cascade = false } = {}): { sql: string } {
  const sql = `
DO $$
DECLARE
  v_schema name;
  v_table name;
  v_column name;
BEGIN
  WITH RECURSIVE column_info AS (
    ${COLUMNS_SQL}
  )
  SELECT schema, ${ident('table')}, name
  INTO v_schema, v_table, v_column
  FROM column_info 
  WHERE id = ${literal(id)};

  IF v_schema IS NULL THEN
    RAISE EXCEPTION 'Column with id % not found', ${literal(id)};
  END IF;

  EXECUTE format(
    'ALTER TABLE %I.%I DROP COLUMN %I ${cascade ? 'CASCADE' : 'RESTRICT'}',
    v_schema,
    v_table,
    v_column
  );
END $$;`

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
