import {
  ident,
  joinSqlFragments,
  keyword,
  literal,
  safeSql,
  type SafeSqlFragment,
} from '../../../pg-format'

type SimplifiedWrapperMeta = {
  handlerName: string
  validatorName: string
  server: { options: { name: string; encrypted: boolean }[] }
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

    return safeSql`
      do $$
      begin
        -- Old wrappers has an implicit dependency on pgsodium. For new wrappers
        -- we use Vault directly.
        if (select extversion from pg_extension where extname = 'wrappers') in (
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
          '0.4.5'
        ) then
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
      end $$;
    `
  })

  const createEncryptedKeysSql = joinSqlFragments(createEncryptedKeysSqlArray, '\n')

  const encryptedOptionsSqlArray = encryptedOptions
    .filter((option) => formState[option.name])
    .map((option) => safeSql`${ident(option.name)} ''%s''`)
  const unencryptedOptionsSqlArray = unencryptedOptions
    .filter((option) => formState[option.name])
    .map((option) => {
      // literal() returns 'value' with single quotes. Escape those quotes for
      // the surrounding E'...' string context ('' represents one ')
      const escapedValue = literal(formState[option.name]).replace(/'/g, "''") as SafeSqlFragment

      return safeSql`${ident(option.name)} ${escapedValue}`
    })
  const optionsSqlArray = joinSqlFragments(
    [...encryptedOptionsSqlArray, ...unencryptedOptionsSqlArray],
    ','
  )

  const createServerSql = safeSql`
    do $$
    declare
      -- Old wrappers has an implicit dependency on pgsodium. For new wrappers
      -- we use Vault directly.
      is_using_old_wrappers bool;
      ${joinSqlFragments(
        encryptedOptions.map((option) => safeSql`${ident(`v_${option.name}`)} text;`),
        '\n'
      )}
    begin
      is_using_old_wrappers := (select extversion from pg_extension where extname = 'wrappers') in (
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
        '0.4.5'
      );
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
          encryptedOptions
            .filter((option) => formState[option.name])
            .map((option) => ident(`v_${option.name}`)),
          ','
        )}
      );
    end $$;
  `

  const createTablesSql = joinSqlFragments(
    tables.map((newTable) => {
      const columns = newTable.columns

      return safeSql`
        create foreign table ${ident(newTable.schema_name)}.${ident(newTable.table_name)} (
          ${joinSqlFragments(
            columns.map((column) => safeSql`${ident(column.name)} ${keyword(column.type)}`),
            ','
          )}
        )
        server ${ident(formState.server_name)}
        options (
          ${joinSqlFragments(
            Object.entries(newTable)
              .filter(
                ([key, value]) =>
                  key !== 'table_name' &&
                  key !== 'schema_name' &&
                  key !== 'columns' &&
                  key !== 'index' &&
                  key !== 'is_new_schema' &&
                  Boolean(value)
              )
              .map(([key, value]) => safeSql`${ident(key)} ${literal(value)}`),
            ','
          )}
        );
      `
    }),
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
  wrapper: { name: string }
  wrapperMeta: SimplifiedWrapperMeta
}): SafeSqlFragment => {
  const encryptedOptions = wrapperMeta.server.options.filter((option) => option.encrypted)

  const deleteEncryptedSecretsSqlArray = encryptedOptions.map((option) => {
    const key = `${wrapper.name}_${option.name}`

    return safeSql`
      do $$
      begin
        -- Old wrappers has an implicit dependency on pgsodium. For new wrappers
        -- we use Vault directly.
        if (select extversion from pg_extension where extname = 'wrappers') in (
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
          '0.4.5'
        ) then
          delete from vault.secrets where key_id = (select id from pgsodium.valid_key where name = ${literal(key)});

          delete from pgsodium.key where name = ${literal(key)};
        else
          delete from vault.secrets where name = ${literal(key)};
        end if;
      end $$;
    `
  })

  const deleteEncryptedSecretsSql = joinSqlFragments(deleteEncryptedSecretsSqlArray, '\n')

  const sql = safeSql`
    drop foreign data wrapper if exists ${ident(wrapper.name)} cascade;

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
  wrapper: { name: string }
  wrapperMeta: SimplifiedWrapperMeta
  formState: { [k: string]: string }
  tables: any[]
}): SafeSqlFragment => {
  const deleteWrapperSql = getDeleteFDWSql({ wrapper, wrapperMeta })
  const createWrapperSql = getCreateFDWSql({
    wrapperMeta,
    formState,
    tables,
    mode: 'tables',
    sourceSchema: '',
    targetSchema: '',
  })

  const sql = safeSql`
    ${deleteWrapperSql}

    ${createWrapperSql}
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
