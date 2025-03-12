import { literal } from './pg-format'
import { EXTENSIONS_SQL } from './sql/extensions'
import { z } from 'zod'

const pgExtensionZod = z.object({
  name: z.string(),
  schema: z.string().nullable(),
  default_version: z.string(),
  installed_version: z.string().nullable(),
  comment: z.string(),
})

const pgExtensionArrayZod = z.array(pgExtensionZod)
const pgExtensionOptionalZod = z.optional(pgExtensionZod)

export type PGExtension = z.infer<typeof pgExtensionZod>

function list({
  limit,
  offset,
}: {
  limit?: number
  offset?: number
} = {}): {
  sql: string
  zod: typeof pgExtensionArrayZod
} {
  let sql = EXTENSIONS_SQL
  if (limit) {
    sql = `${sql} LIMIT ${limit}`
  }
  if (offset) {
    sql = `${sql} OFFSET ${offset}`
  }
  return {
    sql,
    zod: pgExtensionArrayZod,
  }
}

function retrieve({ name }: { name: string }): {
  sql: string
  zod: typeof pgExtensionOptionalZod
} {
  const sql = `${EXTENSIONS_SQL} WHERE name = ${literal(name)};`
  return {
    sql,
    zod: pgExtensionOptionalZod,
  }
}

type ExtensionCreateParams = {
  name: string
  schema?: string
  version?: string
  cascade?: boolean
}

function create({ name, schema, version, cascade = false }: ExtensionCreateParams): {
  sql: string
} {
  const sql = `
do $$
begin
  -- Check if extension exists
  if exists (
    select 1 from pg_extension where extname = ${literal(name)}
  ) then
    raise exception 'Extension % already exists', ${literal(name)};
  end if;

  execute(format('CREATE EXTENSION %I
    %s
    %s
    %s',
    ${literal(name)},
    ${schema ? `'SCHEMA ' || quote_ident(${literal(schema)})` : `''`},
    ${version ? `'VERSION ' || quote_ident(${literal(version)})` : `''`},
    ${cascade ? `'CASCADE'` : `''`}
));
end
$$;`
  return { sql }
}

type ExtensionUpdateParams = {
  update?: boolean
  version?: string
  schema?: string
}

function update(
  name: string,
  { update = false, version, schema }: ExtensionUpdateParams
): { sql: string } {
  const sql = `
do $$
declare
  ext record;
begin
  -- Check if extension exists
  select * into ext from pg_extension where extname = ${literal(name)};
  if ext is null then
    raise exception 'Extension % does not exist', ${literal(name)};
  end if;

  ${
    update
      ? `execute(format('ALTER EXTENSION %I UPDATE %s',
    ${literal(name)},
    ${version ? `'TO ' || quote_ident(${literal(version)})` : `''`}
  ));`
      : ''
  }

  ${
    schema
      ? `execute(format('ALTER EXTENSION %I SET SCHEMA %I',
    ${literal(name)},
    ${literal(schema)}
  ));`
      : ''
  }
end
$$;`
  return { sql }
}

type ExtensionRemoveParams = {
  cascade?: boolean
}

function remove(name: string, { cascade = false }: ExtensionRemoveParams = {}): { sql: string } {
  const sql = `
do $$
declare
  ext record;
begin
    execute(format('DROP EXTENSION %I %s',
      ${literal(name)},
      ${cascade ? `'CASCADE'` : `'RESTRICT'`}
    ));
end
$$;`
  return { sql }
}

export default {
  list,
  retrieve,
  create,
  update,
  remove,
  zod: pgExtensionZod,
}
