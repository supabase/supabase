import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  AvailableColumn,
  WrapperMeta,
} from 'components/interfaces/Database/Wrappers/Wrappers.types'
import { entityTypeKeys } from 'data/entity-types/keys'
import { pgSodiumKeys } from 'data/pg-sodium-keys/keys'
import { executeSql } from 'data/sql/execute-sql-query'
import { sqlKeys } from 'data/sql/keys'
import { wrapWithTransaction } from 'data/sql/utils/transaction'
import { vaultSecretsKeys } from 'data/vault/keys'
import type { ResponseError } from 'types'

export type FDWCreateVariables = {
  projectRef?: string
  connectionString?: string
  wrapperMeta: WrapperMeta
  formState: {
    [k: string]: string
  }
  tables: any[]
}

export function getCreateFDWSql({
  wrapperMeta,
  formState,
  tables,
}: Pick<FDWCreateVariables, 'wrapperMeta' | 'formState' | 'tables'>) {
  const newSchemasSql = tables
    .filter((table) => table.is_new_schema)
    .map((table) => /* SQL */ `create schema if not exists ${table.schema_name};`)
    .join('\n')

  const createWrapperSql = /* SQL */ `
    create foreign data wrapper ${formState.wrapper_name}
    handler ${wrapperMeta.handlerName}
    validator ${wrapperMeta.validatorName};
  `

  const encryptedOptions = wrapperMeta.server.options.filter((option) => option.encrypted)
  const unencryptedOptions = wrapperMeta.server.options.filter((option) => !option.encrypted)

  const createEncryptedKeysSqlArray = encryptedOptions.map((option) => {
    const key = `${formState.wrapper_name}_${option.name}`
    // Escape single quotes in postgresql by doubling them up
    const value = (formState[option.name] || '').replace(/'/g, "''")

    return /* SQL */ `
      select pgsodium.create_key(
        name := '${key}'
      );

      select vault.create_secret (
        new_secret := '${value}',
        new_name   := '${key}',
        new_key_id := (select id from pgsodium.valid_key where name = '${key}')
      );
    `
  })

  const createEncryptedKeysSql = createEncryptedKeysSqlArray.join('\n')

  const encryptedOptionsSqlArray = encryptedOptions.map((option) => `${option.name} ''%s''`)
  const unencryptedOptionsSqlArray = unencryptedOptions.map(
    (option) => `${option.name} ''${formState[option.name]}''`
  )
  const optionsSqlArray = [...encryptedOptionsSqlArray, ...unencryptedOptionsSqlArray].join(',')

  const createServerSql = /* SQL */ `
    do $$
    declare
      ${encryptedOptions.map((option) => `v_${option.name} text;`).join('\n')}
    begin
      ${encryptedOptions
        .map(
          (option) =>
            /* SQL */ `select id into v_${option.name} from pgsodium.valid_key where name = '${formState.wrapper_name}_${option.name}' limit 1;`
        )
        .join('\n')}
    
      execute format(
        E'create server ${formState.server_name}\\n'
        '   foreign data wrapper ${formState.wrapper_name}\\n'
        '   options (\\n'
        '     ${optionsSqlArray}\\n'
        '   );',
        ${encryptedOptions.map((option) => `v_${option.name}`).join(',\n')}
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

  const sql = /* SQL */ `
    ${newSchemasSql}

    ${createWrapperSql}

    ${createEncryptedKeysSql}

    ${createServerSql}

    ${createTablesSql}
  `

  return sql
}

export async function createFDW({
  projectRef,
  connectionString,
  wrapperMeta,
  formState,
  tables,
}: FDWCreateVariables) {
  const sql = wrapWithTransaction(getCreateFDWSql({ wrapperMeta, formState, tables }))
  const { result } = await executeSql({ projectRef, connectionString, sql })
  return result
}

type FDWCreateData = Awaited<ReturnType<typeof createFDW>>

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
        queryClient.invalidateQueries(entityTypeKeys.list(projectRef)),
        queryClient.invalidateQueries(sqlKeys.query(projectRef, ['fdws']), { refetchType: 'all' }),
        queryClient.invalidateQueries(pgSodiumKeys.list(projectRef)),
        queryClient.invalidateQueries(sqlKeys.query(projectRef, vaultSecretsKeys.list(projectRef))),
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
