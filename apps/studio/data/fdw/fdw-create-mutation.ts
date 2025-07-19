import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  AvailableColumn,
  WrapperMeta,
} from 'components/interfaces/Integrations/Wrappers/Wrappers.types'
import { entityTypeKeys } from 'data/entity-types/keys'
import { foreignTableKeys } from 'data/foreign-tables/keys'
import { executeSql } from 'data/sql/execute-sql-query'
import { wrapWithTransaction } from 'data/sql/utils/transaction'
import { vaultSecretsKeys } from 'data/vault/keys'
import type { ResponseError } from 'types'
import { fdwKeys } from './keys'

export type FDWCreateVariables = {
  projectRef?: string
  connectionString?: string | null
  wrapperMeta: WrapperMeta
  formState: {
    [k: string]: string
  }
  // If mode is skip, the wrapper will skip the last step, binding the schema/tables to foreign data. This could be done later.
  mode: 'tables' | 'schema' | 'skip'
  tables: any[]
  sourceSchema: string
  targetSchema: string
}

export function getCreateFDWSql({
  wrapperMeta,
  formState,
  mode,
  tables,
  sourceSchema,
  targetSchema,
}: Pick<
  FDWCreateVariables,
  'wrapperMeta' | 'formState' | 'tables' | 'mode' | 'sourceSchema' | 'targetSchema'
>) {
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
    // wrap all options in double quotes, some option names have dots in them
    .map((option) => `"${option.name}" ''${formState[option.name]}''`)
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
      const columns: AvailableColumn[] = newTable.columns

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

  const importForeignSchemaSql = /* SQL */ `
  import foreign schema "${sourceSchema}" from server ${formState.server_name} into ${targetSchema} options (strict 'true');
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

export async function createFDW({ projectRef, connectionString, ...rest }: FDWCreateVariables) {
  const sql = wrapWithTransaction(getCreateFDWSql(rest))
  const { result } = await executeSql({ projectRef, connectionString, sql })
  return result
}

export type FDWCreateData = Awaited<ReturnType<typeof createFDW>>

export const useFDWCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<FDWCreateData, ResponseError, FDWCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<FDWCreateData, ResponseError, FDWCreateVariables>((vars) => createFDW(vars), {
    async onSuccess(data, variables, context) {
      const { projectRef } = variables

      await Promise.all([
        queryClient.invalidateQueries(fdwKeys.list(projectRef), { refetchType: 'all' }),
        queryClient.invalidateQueries(entityTypeKeys.list(projectRef)),
        queryClient.invalidateQueries(foreignTableKeys.list(projectRef)),
        queryClient.invalidateQueries(vaultSecretsKeys.list(projectRef)),
      ])

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(
          `Failed to create ${variables.wrapperMeta.label} foreign data wrapper: ${data.message}`
        )
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
