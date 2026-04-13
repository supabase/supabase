type SimplifiedWrapperMeta = {
  handlerName: string
  validatorName: string
  server: { options: { name: string; encrypted: boolean }[] }
}

export const getFDWsSql = () => {
  const sql = /* SQL */ `
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
  tables: any[]
  sourceSchema: string
  targetSchema: string
  schemaOptions?: string[]
}) {
  const newSchemasSql = tables
    .filter((table) => table.is_new_schema)
    .map((table) => /* SQL */ `create schema if not exists ${table.schema_name};`)
    .join('\n')

  const createWrapperSql = /* SQL */ `
    create foreign data wrapper "${formState.wrapper_name}"
    handler "${wrapperMeta.handlerName}"
    validator "${wrapperMeta.validatorName}";
  `

  const encryptedOptions = wrapperMeta.server.options.filter((option) => option.encrypted)
  const unencryptedOptions = wrapperMeta.server.options.filter((option) => !option.encrypted)

  const createEncryptedKeysSqlArray = encryptedOptions.map((option) => {
    const key = `${formState.wrapper_name}_${option.name}`
    // Escape single quotes in postgresql by doubling them up
    const value = (formState[option.name] || '').replace(/'/g, "''")

    return /* SQL */ `
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
            name := '${key}'
          );

          perform vault.create_secret(
            new_secret := '${value}',
            new_name   := '${key}',
            new_key_id := (select id from pgsodium.valid_key where name = '${key}')
          );
        else
          perform vault.create_secret(
            new_secret := '${value}',
            new_name := '${key}'
          );
        end if;
      end $$;
    `
  })

  const createEncryptedKeysSql = createEncryptedKeysSqlArray.join('\n')

  const encryptedOptionsSqlArray = encryptedOptions
    .filter((option) => formState[option.name])
    .map((option) => `${option.name} ''%s''`)
  const unencryptedOptionsSqlArray = unencryptedOptions
    .filter((option) => formState[option.name])
    // wrap all option names in double quotes to handle dots
    // wrap all options values in single quotes, replace single quotes with 4 single quotes to escape them in SQL past the execute format
    .map((option) => `"${option.name}" ''${formState[option.name].replace(/'/g, `''''`)}''`)
  const optionsSqlArray = [...encryptedOptionsSqlArray, ...unencryptedOptionsSqlArray].join(',')

  const createServerSql = /* SQL */ `
    do $$
    declare
      -- Old wrappers has an implicit dependency on pgsodium. For new wrappers
      -- we use Vault directly.
      is_using_old_wrappers bool;
      ${encryptedOptions.map((option) => `v_${option.name} text;`).join('\n')}
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
      ${encryptedOptions
        .map(
          (option) => /* SQL */ `
              if is_using_old_wrappers then
                select id into v_${option.name} from pgsodium.valid_key where name = '${formState.wrapper_name}_${option.name}' limit 1;
              else
                select id into v_${option.name} from vault.secrets where name = '${formState.wrapper_name}_${option.name}' limit 1;
              end if;
            `
        )
        .join('\n')}
    
      execute format(
        E'create server "${formState.server_name}" foreign data wrapper "${formState.wrapper_name}" options (${optionsSqlArray});',
        ${encryptedOptions
          .filter((option) => formState[option.name])
          .map((option) => `v_${option.name}`)
          .join(',\n')}
      );
    end $$;
  `

  const createTablesSql = tables
    .map((newTable) => {
      const columns = newTable.columns as {
        name: string
        type: string
      }[]

      return /* SQL */ `
        create foreign table "${newTable.schema_name}"."${newTable.table_name}" (
          ${columns.map((column) => `"${column.name}" ${column.type}`).join(',\n          ')}
        )
        server ${formState.server_name}
        options (
          ${Object.entries(newTable)
            .filter(
              ([key, value]) =>
                key !== 'table_name' &&
                key !== 'schema_name' &&
                key !== 'columns' &&
                key !== 'index' &&
                key !== 'is_new_schema' &&
                Boolean(value)
            )
            .map(([key, value]) => `${key} '${value}'`)
            .join(',\n          ')}
        );
      `
    })
    .join('\n\n')

  const options = [...schemaOptions, "strict 'true'"].join(', ')

  const importForeignSchemaSql = /* SQL */ `
  import foreign schema "${sourceSchema}" from server ${formState.server_name} into ${targetSchema} options (${options});
`

  const sql = /* SQL */ `
    ${newSchemasSql}

    ${createWrapperSql}

    ${createEncryptedKeysSql}

    ${createServerSql}

    ${mode === 'tables' ? createTablesSql : ''}

    ${mode === 'schema' ? importForeignSchemaSql : ''}
  `

  return sql
}

export const getDeleteFDWSql = ({
  wrapper,
  wrapperMeta,
}: {
  wrapper: { name: string }
  wrapperMeta: SimplifiedWrapperMeta
}) => {
  const encryptedOptions = wrapperMeta.server.options.filter((option) => option.encrypted)

  const deleteEncryptedSecretsSqlArray = encryptedOptions.map((option) => {
    const key = `${wrapper.name}_${option.name}`

    return /* SQL */ `
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
          delete from vault.secrets where key_id = (select id from pgsodium.valid_key where name = '${key}');

          delete from pgsodium.key where name = '${key}';
        else
          delete from vault.secrets where name = '${key}';
        end if;
      end $$;
    `
  })

  const deleteEncryptedSecretsSql = deleteEncryptedSecretsSqlArray.join('\n')

  const sql = /* SQL */ `
    drop foreign data wrapper if exists "${wrapper.name}" cascade;

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
}) => {
  const deleteWrapperSql = getDeleteFDWSql({ wrapper, wrapperMeta })
  const createWrapperSql = getCreateFDWSql({
    wrapperMeta,
    formState,
    tables,
    mode: 'tables',
    sourceSchema: '',
    targetSchema: '',
  })

  const sql = /* SQL */ `
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
  schemaOptions?: string[]
}) {
  const options = [...schemaOptions, "strict 'true'"].join(', ')

  const sql = /* SQL */ `
  import foreign schema "${sourceSchema}" from server ${serverName} into ${targetSchema} options (${options});
`

  return sql
}

export function getDropForeignTableSql({ schema, table }: { schema: string; table: string }) {
  const sql = /* SQL */ `
drop foreign table if exists "${schema}"."${table}";
`

  return sql
}
