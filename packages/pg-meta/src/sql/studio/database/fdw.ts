import {
  ident,
  joinSqlFragments,
  keyword,
  literal,
  safeSql,
  type SafeSqlFragment,
} from '../../../pg-format'

// Pick a `$$…$$` delimiter for a `DO` block that is absent from every
// string in `values`. See the matching helper in
// `packages/pg-meta/src/pg-meta-tables.ts` for the full rationale;
// the same dollar-quote-collision bug exists in the three DO blocks
// below (create-encrypted-keys, create-server, delete-encrypted-keys),
// each of which embeds the wrapper_name (combined with the option
// name into a `key`) via `${literal(key)}` inside the body. If
// `wrapper_name` or `option.name` contains the literal `$$` the
// rendered literal closes the outer `do $$` delimiter early.
function getDoBlockDelimiter(values: string[]): SafeSqlFragment {
  let suffix = 0
  while (true) {
    const delimiter =
      suffix === 0
        ? (safeSql`$pg_meta$` as SafeSqlFragment)
        : (safeSql`$pg_meta_${literal(suffix)}$` as SafeSqlFragment)
    if (values.every((value) => !value.includes(delimiter))) {
      return delimiter
    }
    suffix += 1
  }
}

type SimplifiedWrapperMeta = {
  handlerName: string
  validatorName: string
  server: { options: { name: string; encrypted: boolean }[] }
}

type WrapperExistingTable = {
  id: string | number
  schema: string
  name: string
  columns: { name: string; type: string }[]
  options: string[] | null
}

type WrapperFormTable = {
  schema_name: string
  table_name: string
  columns: { name: string; type: string }[]
  is_new_schema?: boolean
} & Record<string, unknown>

// Old wrappers has an implicit dependency on pgsodium. For new wrappers we use Vault directly.
const LEGACY_WRAPPER_EXTENSION_VERSIONS = [
  '0.1.0',
  '0.1.1',
  '0.1.4',
  '0.1.5',
  '0.1.6',
  '0.1.7',
  '0.1.8',
  '0.1.9',
  '0.1.10',
  '0.1.11',
  '0.1.12',
  '0.1.14',
  '0.1.15',
  '0.1.16',
  '0.1.17',
  '0.1.18',
  '0.1.19',
  '0.2.0',
  '0.3.0',
  '0.3.1',
  '0.4.0',
  '0.4.1',
  '0.4.2',
  '0.4.3',
  '0.4.4',
  '0.4.5',
]

const TABLE_META_KEYS = new Set([
  'table_name',
  'schema_name',
  'schema',
  'id',
  'columns',
  'index',
  'is_new_schema',
])

const isUsingOldWrappersSql = safeSql`
  (select extversion from pg_extension where extname = 'wrappers') in (${joinSqlFragments(
    LEGACY_WRAPPER_EXTENSION_VERSIONS.map((version) => literal(version)),
    ','
  )})
`

function parseOptionsArray(options?: string[] | null): Record<string, string> {
  return Object.fromEntries(
    (options ?? []).map((entry) => {
      const index = entry.indexOf('=')
      return index === -1 ? [entry, ''] : [entry.slice(0, index), entry.slice(index + 1)]
    })
  )
}

function getTableOptionsMap(table: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(table).filter(([key, value]) => !TABLE_META_KEYS.has(key) && Boolean(value)) as [
      string,
      string,
    ][]
  )
}

function buildCreateForeignTableSql(
  table: {
    schema_name: string
    table_name: string
    columns: { name: string; type: string }[]
  } & Record<string, unknown>,
  serverName: string
): SafeSqlFragment {
  const optionsMap = getTableOptionsMap(table)

  return safeSql`
    create foreign table ${ident(table.schema_name)}.${ident(table.table_name)} (
      ${joinSqlFragments(
        table.columns.map((column) => safeSql`${ident(column.name)} ${keyword(column.type)}`),
        ','
      )}
    )
    server ${ident(serverName)}
    options (
      ${joinSqlFragments(
        Object.entries(optionsMap).map(([key, value]) => safeSql`${ident(key)} ${literal(value)}`),
        ','
      )}
    );
  `
}

function tableKey(schema: string, table: string): string {
  return `${schema}.${table}`
}

// ALTER FOREIGN TABLE doesn't support changing a column's type in place, so a
// retyped column is dropped and re-added with the new type.
function diffTableColumns(
  currentColumns: { name: string; type: string }[],
  desiredColumns: { name: string; type: string }[]
) {
  const currentByName = new Map(currentColumns.map((column) => [column.name, column.type]))
  const desiredByName = new Map(desiredColumns.map((column) => [column.name, column.type]))

  const columnsToAdd = desiredColumns.filter(
    (column) => currentByName.get(column.name) !== column.type
  )
  const columnsToDrop = currentColumns.filter(
    (column) => desiredByName.get(column.name) !== column.type
  )

  return { columnsToAdd, columnsToDrop }
}

function buildOptionsDiffClauses(
  currentOptions: Record<string, string>,
  desiredOptions: Record<string, string>
): SafeSqlFragment[] {
  const clauses: SafeSqlFragment[] = []

  for (const [key, value] of Object.entries(desiredOptions)) {
    if (!(key in currentOptions)) {
      clauses.push(safeSql`add ${ident(key)} ${literal(value)}`)
    } else if (currentOptions[key] !== value) {
      clauses.push(safeSql`set ${ident(key)} ${literal(value)}`)
    }
  }
  for (const key of Object.keys(currentOptions)) {
    if (!(key in desiredOptions)) {
      clauses.push(safeSql`drop ${ident(key)}`)
    }
  }

  return clauses
}

function buildAlterForeignTableSql(
  schema: string,
  table: string,
  current: WrapperExistingTable,
  desired: WrapperFormTable
): SafeSqlFragment {
  const { columnsToAdd, columnsToDrop } = diffTableColumns(current.columns, desired.columns)

  const dropColumnsSql =
    columnsToDrop.length > 0
      ? safeSql`
          alter foreign table ${ident(schema)}.${ident(table)}
          ${joinSqlFragments(
            columnsToDrop.map((column) => safeSql`drop column ${ident(column.name)}`),
            ', '
          )};
        `
      : safeSql``

  const addColumnsSql =
    columnsToAdd.length > 0
      ? safeSql`
          alter foreign table ${ident(schema)}.${ident(table)}
          ${joinSqlFragments(
            columnsToAdd.map(
              (column) => safeSql`add column ${ident(column.name)} ${keyword(column.type)}`
            ),
            ', '
          )};
        `
      : safeSql``

  const optionsClauses = buildOptionsDiffClauses(
    parseOptionsArray(current.options),
    getTableOptionsMap(desired)
  )
  const optionsSql =
    optionsClauses.length > 0
      ? safeSql`
          alter foreign table ${ident(schema)}.${ident(table)}
          options (${joinSqlFragments(optionsClauses, ', ')});
        `
      : safeSql``

  return safeSql`
    ${dropColumnsSql}
    ${addColumnsSql}
    ${optionsSql}
  `
}

export const getFDWsSql = (): SafeSqlFragment => {
  const sql = safeSql`
    select
      s.oid as "id",
      w.fdwname as "name",
      s.srvname as "server_name",
      s.srvoptions as "server_options",
      c.proname as "handler",
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', c.oid::bigint,
            'schema', relnamespace::regnamespace::text,
            'name', c.relname,
            'columns', (
              select jsonb_agg(
                jsonb_build_object(
                  'name', a.attname,
                  'type', pg_catalog.format_type(a.atttypid, a.atttypmod)
                )
              )
              from pg_catalog.pg_attribute a
              where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
            ),
            'options', t.ftoptions
          )
        )
        from pg_catalog.pg_class c
        join pg_catalog.pg_foreign_table t on c.oid = t.ftrelid
        where c.oid = any (select t.ftrelid from pg_catalog.pg_foreign_table t where t.ftserver = s.oid)
      ) as "tables"
    from pg_catalog.pg_foreign_server s
    join pg_catalog.pg_foreign_data_wrapper w on s.srvfdw = w.oid
    join pg_catalog.pg_proc c on w.fdwhandler = c.oid;
  `

  return sql
}

export function getCreateFDWSql({
  wrapperMeta,
  formState,
  mode,
  tables,
  sourceSchema,
  targetSchema,
  schemaOptions = [],
}: {
  wrapperMeta: SimplifiedWrapperMeta
  formState: {
    [k: string]: string
  }
  // If mode is skip, the wrapper will skip the last step, binding the schema/tables to foreign data. This could be done later.
  mode: 'tables' | 'schema' | 'skip'
  tables: {
    is_new_schema: boolean
    schema_name: string
    table_name: string
    columns: { name: string; type: string }[]
  }[]
  sourceSchema: string
  targetSchema: string
  schemaOptions?: SafeSqlFragment[]
}): SafeSqlFragment {
  const newSchemasSql = joinSqlFragments(
    tables
      .filter((table) => table.is_new_schema)
      .map((table) => safeSql`create schema if not exists ${ident(table.schema_name)};`),
    '\n'
  )

  const createWrapperSql = safeSql`
    create foreign data wrapper ${ident(formState.wrapper_name)}
    handler ${ident(wrapperMeta.handlerName)}
    validator ${ident(wrapperMeta.validatorName)};
  `

  const encryptedOptions = wrapperMeta.server.options.filter((option) => option.encrypted)
  const unencryptedOptions = wrapperMeta.server.options.filter((option) => !option.encrypted)

  const createEncryptedKeysSqlArray = encryptedOptions.map((option) => {
    const key = `${formState.wrapper_name}_${option.name}`
    const quotedValue = literal(formState[option.name] || '')

    // The body embeds `key` (composed of `wrapper_name` and
    // `option.name`) via `${literal(key)}` and the encrypted
    // option value as `new_secret := ${quotedValue}` (where
    // `quotedValue = literal(formState[option.name] || '')`). If
    // any of those values contains the literal `$$` the body
    // closes the outer `do $$` delimiter early and the statement
    // fails with `syntax error at or near "..."`. Pick a delimiter
    // that is absent from all three values.
    const doBlockDelimiter = getDoBlockDelimiter([
      key,
      formState.wrapper_name,
      option.name,
      formState[option.name] || '',
    ])

    return safeSql`
      do ${doBlockDelimiter}
      begin
        if ${isUsingOldWrappersSql} then
          create extension if not exists pgsodium;

          perform pgsodium.create_key(
            name := ${literal(key)}
          );

          perform vault.create_secret(
            new_secret := ${quotedValue},
            new_name   := ${literal(key)},
            new_key_id := (select id from pgsodium.valid_key where name = ${literal(key)})
          );
        else
          perform vault.create_secret(
            new_secret := ${quotedValue},
            new_name := ${literal(key)}
          );
        end if;
      end ${doBlockDelimiter};
    `
  })

  const createEncryptedKeysSql = joinSqlFragments(createEncryptedKeysSqlArray, '\n')

  const encryptedOptionsSqlArray = encryptedOptions
    .filter((option) => formState[option.name])
    .map((option) => safeSql`${ident(option.name)} ''%s''`)
  // Unencrypted option values are passed as format() %L arguments (below) so
  // Postgres escapes them once for the inner create-server literal. Pre-escaping
  // here and embedding in the outer E'...' string would decode backslashes twice,
  // which aborts creation (invalid Unicode escape) or silently corrupts the value.
  const unencryptedOptionsFilter = unencryptedOptions.filter((option) => formState[option.name])
  const unencryptedOptionsSqlArray = unencryptedOptionsFilter.map(
    (option) => safeSql`${ident(option.name)} %L`
  )
  const optionsSqlArray = joinSqlFragments(
    [...encryptedOptionsSqlArray, ...unencryptedOptionsSqlArray],
    ','
  )

  // The body embeds `formState.server_name` and `formState.wrapper_name`
  // via `${ident(...)}` (which quotes the name as `"weird$$name"`
  // rather than silently changing the meaning) and the option keys /
  // values via `${literal(...)}`. If any of those values contains the
  // literal `$$` the body closes the outer `do $$` delimiter early
  // and the statement fails with `syntax error at or near "..."`.
  // Pick a delimiter that is absent from every value that flows into
  // the body.
  const createServerDoBlockDelimiter = getDoBlockDelimiter([
    formState.server_name,
    formState.wrapper_name,
    ...wrapperMeta.server.options.map((option) => option.name),
    ...encryptedOptions.map((option) => `${formState.wrapper_name}_${option.name}`),
    ...wrapperMeta.server.options
      .filter((option) => formState[option.name])
      .map((option) => formState[option.name]),
  ])

  const createServerSql = safeSql`
    do ${createServerDoBlockDelimiter}
    declare
      -- Old wrappers has an implicit dependency on pgsodium. For new wrappers
      -- we use Vault directly.
      is_using_old_wrappers bool;
      ${joinSqlFragments(
        encryptedOptions.map((option) => safeSql`${ident(`v_${option.name}`)} text;`),
        '\n'
      )}
    begin
      is_using_old_wrappers := ${isUsingOldWrappersSql};
      ${joinSqlFragments(
        encryptedOptions.map(
          (option) => safeSql`
              if is_using_old_wrappers then
                select id into ${ident(`v_${option.name}`)} from pgsodium.valid_key where name = ${literal(`${formState.wrapper_name}_${option.name}`)} limit 1;
              else
                select id into ${ident(`v_${option.name}`)} from vault.secrets where name = ${literal(`${formState.wrapper_name}_${option.name}`)} limit 1;
              end if;
            `
        ),
        '\n'
      )}

      execute format(
        E'create server ${ident(formState.server_name)} foreign data wrapper ${ident(formState.wrapper_name)} options (${optionsSqlArray});',
        ${joinSqlFragments(
          [
            ...encryptedOptions
              .filter((option) => formState[option.name])
              .map((option) => ident(`v_${option.name}`)),
            ...unencryptedOptionsFilter.map((option) => literal(formState[option.name])),
          ],
          ','
        )}
      );
    end ${createServerDoBlockDelimiter};
  `

  const createTablesSql = joinSqlFragments(
    tables.map((newTable) => buildCreateForeignTableSql(newTable, formState.server_name)),
    '\n\n'
  )

  const options = joinSqlFragments([...schemaOptions, safeSql`strict 'true'`], ', ')

  function createImportForeignSchemaSql(): SafeSqlFragment {
    return safeSql`
  import foreign schema ${ident(sourceSchema)} from server ${ident(formState.server_name)} into ${ident(targetSchema)} options (${options});
`
  }

  const sql = safeSql`
    ${newSchemasSql}

    ${createWrapperSql}

    ${createEncryptedKeysSql}

    ${createServerSql}

    ${mode === 'tables' ? createTablesSql : safeSql``}

    ${mode === 'schema' ? createImportForeignSchemaSql() : safeSql``}
  `

  return sql
}

export const getDeleteFDWSql = ({
  wrapper,
  wrapperMeta,
}: {
  wrapper: { id: number; name: string; server_name: string }
  wrapperMeta: SimplifiedWrapperMeta
}): SafeSqlFragment => {
  const encryptedOptions = wrapperMeta.server.options.filter((option) => option.encrypted)

  const deleteEncryptedSecretsSqlArray = encryptedOptions.map((option) => {
    const key = `${wrapper.name}_${option.name}`

    // Same dollar-quote-collision rationale as the create paths:
    // the body embeds `key` (composed of `wrapper.name` and
    // `option.name`) via `${literal(key)}`. If either contains the
    // literal `$$` the body closes the outer `do $$` delimiter
    // early. Pick a delimiter that is absent from both names.
    const doBlockDelimiter = getDoBlockDelimiter([key, wrapper.name, option.name])

    return safeSql`
      do ${doBlockDelimiter}
      begin
        if not exists (
          select 1 from pg_catalog.pg_foreign_data_wrapper where fdwname = ${literal(wrapper.name)}
        ) then
          if ${isUsingOldWrappersSql} then
            delete from vault.secrets where key_id = (select id from pgsodium.valid_key where name = ${literal(key)});

            delete from pgsodium.key where name = ${literal(key)};
          else
            delete from vault.secrets where name = ${literal(key)};
          end if;
        end if;
      end ${doBlockDelimiter};
    `
  })

  const deleteEncryptedSecretsSql = joinSqlFragments(deleteEncryptedSecretsSqlArray, '\n')

  const ensureSelectedServerSql = safeSql`
    begin
      if not exists (
        select 1
        from pg_catalog.pg_foreign_server s
        join pg_catalog.pg_foreign_data_wrapper w on w.oid = s.srvfdw
        where s.oid = ${literal(wrapper.id)}
          and s.srvname = ${literal(wrapper.server_name)}
          and w.fdwname = ${literal(wrapper.name)}
      ) then
        raise exception 'The selected foreign server no longer belongs to this wrapper.';
      end if;
    end
  `

  const sql = safeSql`
    do ${literal(ensureSelectedServerSql)};

    drop server if exists ${ident(wrapper.server_name)} cascade;

    do $$
    begin
      if not exists (
        select 1
        from pg_catalog.pg_foreign_server s
        join pg_catalog.pg_foreign_data_wrapper w on w.oid = s.srvfdw
        where w.fdwname = ${literal(wrapper.name)}
      ) then
        execute format('drop foreign data wrapper if exists %I cascade', ${literal(wrapper.name)});
      end if;
    end $$;

    ${deleteEncryptedSecretsSql}
  `

  return sql
}

export const getUpdateFDWSql = ({
  wrapper,
  wrapperMeta,
  formState,
  tables,
}: {
  wrapper: {
    id: number
    name: string
    server_name: string
    server_options?: string[] | null
    tables?: WrapperExistingTable[] | null
  }
  wrapperMeta: SimplifiedWrapperMeta
  formState: { [k: string]: string }
  tables: WrapperFormTable[]
}): SafeSqlFragment => {
  const ensureWrapperIsNotSharedSql = safeSql`
    do $$
    begin
      if exists (
        select 1
        from pg_catalog.pg_foreign_server s
        join pg_catalog.pg_foreign_data_wrapper w on w.oid = s.srvfdw
        where w.fdwname = ${literal(wrapper.name)}
          and s.srvname <> ${literal(wrapper.server_name)}
      ) then
        raise exception 'This wrapper is used by another server and cannot be edited here.';
      end if;
    end $$;
  `

  const nameChanged = formState.wrapper_name !== wrapper.name
  const renameWrapperSql = nameChanged
    ? safeSql`alter foreign data wrapper ${ident(wrapper.name)} rename to ${ident(formState.wrapper_name)};`
    : safeSql``

  // formState.server_name is never actually re-derived from wrapper_name before
  // submit (see EditWrapperSheet), so the server itself is never renamed here -
  // wrapper.server_name (the real, current name) is the only name we alter/target.
  const encryptedOptions = wrapperMeta.server.options.filter((option) => option.encrypted)
  const unencryptedOptions = wrapperMeta.server.options.filter((option) => !option.encrypted)
  const currentServerOptions = parseOptionsArray(wrapper.server_options)

  const serverOptionClauses: SafeSqlFragment[] = []
  const encryptedOptionSqlArray: SafeSqlFragment[] = []

  for (const option of unencryptedOptions) {
    const currentValue = currentServerOptions[option.name]
    const newValue = formState[option.name]

    if (newValue) {
      if (currentValue === undefined) {
        serverOptionClauses.push(safeSql`add ${ident(option.name)} ${literal(newValue)}`)
      } else if (currentValue !== newValue) {
        serverOptionClauses.push(safeSql`set ${ident(option.name)} ${literal(newValue)}`)
      }
    } else if (currentValue !== undefined) {
      serverOptionClauses.push(safeSql`drop ${ident(option.name)}`)
    }
  }

  for (const option of encryptedOptions) {
    const existingSecretId = currentServerOptions[option.name]
    const newValue = formState[option.name]
    const newSecretName = `${formState.wrapper_name}_${option.name}`

    if (newValue && existingSecretId !== undefined) {
      // Secret already exists: update its value (and name, in case the wrapper
      // was renamed) in place instead of deleting and recreating it.
      encryptedOptionSqlArray.push(safeSql`
        do $$
        declare
          v_secret_id uuid;
        begin
          if ${isUsingOldWrappersSql} then
            select id into v_secret_id from vault.secrets where key_id = ${literal(existingSecretId)} limit 1;
          else
            v_secret_id := ${literal(existingSecretId)}::uuid;
          end if;

          perform vault.update_secret(
            secret_id := v_secret_id,
            new_secret := ${literal(newValue)},
            new_name := ${literal(newSecretName)}
          );
        end $$;
      `)
    } else if (newValue && existingSecretId === undefined) {
      // Option newly populated: create the secret then wire it up as a server option.
      encryptedOptionSqlArray.push(safeSql`
        do $$
        begin
          if ${isUsingOldWrappersSql} then
            create extension if not exists pgsodium;

            perform pgsodium.create_key(name := ${literal(newSecretName)});

            perform vault.create_secret(
              new_secret := ${literal(newValue)},
              new_name := ${literal(newSecretName)},
              new_key_id := (select id from pgsodium.valid_key where name = ${literal(newSecretName)})
            );
          else
            perform vault.create_secret(
              new_secret := ${literal(newValue)},
              new_name := ${literal(newSecretName)}
            );
          end if;
        end $$;

        do $$
        declare
          v_secret_ref text;
        begin
          if ${isUsingOldWrappersSql} then
            select id::text into v_secret_ref from pgsodium.valid_key where name = ${literal(newSecretName)} limit 1;
          else
            select id::text into v_secret_ref from vault.secrets where name = ${literal(newSecretName)} limit 1;
          end if;

          execute format('alter server ${ident(wrapper.server_name)} options (add ${ident(option.name)} %L)', v_secret_ref);
        end $$;
      `)
    } else if (!newValue && existingSecretId !== undefined) {
      // Option cleared: drop the server option and delete the now-orphaned secret.
      serverOptionClauses.push(safeSql`drop ${ident(option.name)}`)
      encryptedOptionSqlArray.push(safeSql`
        do $$
        begin
          if ${isUsingOldWrappersSql} then
            delete from vault.secrets where key_id = ${literal(existingSecretId)};
            delete from pgsodium.key where id = ${literal(existingSecretId)};
          else
            delete from vault.secrets where id = ${literal(existingSecretId)}::uuid;
          end if;
        end $$;
      `)
    }
  }

  const alterServerOptionsSql =
    serverOptionClauses.length > 0
      ? safeSql`
          alter server ${ident(wrapper.server_name)}
          options (${joinSqlFragments(serverOptionClauses, ', ')});
        `
      : safeSql``
  const encryptedOptionsSql = joinSqlFragments(encryptedOptionSqlArray, '\n')

  const currentTables = wrapper.tables ?? []
  const currentTableByKey = new Map(
    currentTables.map((table) => [tableKey(table.schema, table.name), table])
  )
  const desiredTableByKey = new Map(
    tables.map((table) => [tableKey(table.schema_name, table.table_name), table])
  )

  const tablesToCreate = tables.filter(
    (table) => !currentTableByKey.has(tableKey(table.schema_name, table.table_name))
  )
  const tablesToDrop = currentTables.filter(
    (table) => !desiredTableByKey.has(tableKey(table.schema, table.name))
  )

  const newSchemasSql = joinSqlFragments(
    tablesToCreate
      .filter((table) => table.is_new_schema)
      .map((table) => safeSql`create schema if not exists ${ident(table.schema_name)};`),
    '\n'
  )
  const createTablesSql = joinSqlFragments(
    tablesToCreate.map((table) => buildCreateForeignTableSql(table, wrapper.server_name)),
    '\n'
  )
  const dropTablesSql = joinSqlFragments(
    tablesToDrop.map((table) =>
      getDropForeignTableSql({ schema: table.schema, table: table.name })
    ),
    '\n'
  )
  const alterTablesSql = joinSqlFragments(
    tables
      .map((desired) => {
        const current = currentTableByKey.get(tableKey(desired.schema_name, desired.table_name))
        if (!current) return null
        return buildAlterForeignTableSql(desired.schema_name, desired.table_name, current, desired)
      })
      .filter((sql): sql is SafeSqlFragment => sql !== null),
    '\n'
  )

  const sql = safeSql`
    ${ensureWrapperIsNotSharedSql}
    ${renameWrapperSql}
    ${alterServerOptionsSql}
    ${encryptedOptionsSql}
    ${newSchemasSql}
    ${dropTablesSql}
    ${createTablesSql}
    ${alterTablesSql}
  `

  return sql
}

export function getImportForeignSchemaSql({
  serverName,
  sourceSchema,
  targetSchema,
  schemaOptions = [],
}: {
  serverName: string
  sourceSchema: string
  targetSchema: string
  schemaOptions?: SafeSqlFragment[]
}): SafeSqlFragment {
  const options = joinSqlFragments([...schemaOptions, safeSql`strict 'true'`], ', ')

  const sql = safeSql`
  import foreign schema ${ident(sourceSchema)} from server ${ident(serverName)} into ${ident(targetSchema)} options (${options});
`

  return sql
}

export function getDropForeignTableSql({
  schema,
  table,
}: {
  schema: string
  table: string
}): SafeSqlFragment {
  const sql = safeSql`
drop foreign table if exists ${ident(schema)}.${ident(table)};
`

  return sql
}
