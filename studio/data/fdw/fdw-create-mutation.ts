import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { AvailableColumn, Wrapper } from 'components/interfaces/Database/Wrappers/types'
import { executeSql } from 'data/sql/execute-sql-query'
import { sqlKeys } from 'data/sql/keys'

export type FDWCreateVariables = {
  projectRef?: string
  connectionString?: string
  wrapper: Wrapper
  formState: {
    [k: string]: string
  }
  newTables: any[]
}

export function getFDWCreateSql({
  wrapper,
  formState,
  newTables,
}: Pick<FDWCreateVariables, 'wrapper' | 'formState' | 'newTables'>) {
  const createWrapperSql = /* SQL */ `
    create foreign data wrapper ${wrapper.name}
    handler wrappers_handler
    validator wrappers_validator
    options (
      wrapper '${wrapper.extensionName}'
    );
  `

  const encryptedOptions = wrapper.server.options.filter((option) => option.encrypted)
  const unencryptedOptions = wrapper.server.options.filter((option) => !option.encrypted)

  const createEncryptedKeysSqlArray = encryptedOptions.map((option) => {
    const key = `${wrapper.name}_${option.name}`
    const value = formState[option.name] // TODO(alaister): escape '

    return /* SQL */ `
      select pgsodium.create_key(name := '${key}');

      insert into vault.secrets (secret, key_id) values (
        '${value}',
        (select id from pgsodium.valid_key where name = '${key}')
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
            /* SQL */ `select id into v_${option.name} from pgsodium.valid_key where name = '${wrapper.name}_${option.name}' limit 1;`
        )
        .join('\n')}
    
      execute format(
        E'create server ${wrapper.server.name}\\n'
        '   foreign data wrapper ${wrapper.name}\\n'
        '   options (\\n'
        '     ${optionsSqlArray}\\n'
        '   );',
        ${encryptedOptions.map((option) => `v_${option.name}`).join(',\n')}
      );
    end $$;
  `

  const createTablesSql = newTables
    .map((newTable) => {
      const table = wrapper.tables[newTable.index]

      const columns: AvailableColumn[] = newTable.columns
        .map((name: string) => table.availableColumns.find((c) => c.name === name))
        .filter(Boolean)

      return /* SQL */ `
        create foreign table ${newTable.table_name} (
          ${columns.map((column) => `${column.name} ${column.type}`).join(',\n          ')}
        )
        server ${wrapper.server.name}
        options (
          ${Object.entries(newTable.options)
            .map(([key, value]) => `${key} '${value}'`)
            .join(',\n          ')}
        );
      `
    })
    .join('\n\n')

  const sql = /* SQL */ `
    begin;

    ${createWrapperSql}

    ${createEncryptedKeysSql}

    ${createServerSql}

    ${createTablesSql}

    commit;
  `

  return sql
}

export async function createFDW({
  projectRef,
  connectionString,
  wrapper,
  formState,
  newTables,
}: FDWCreateVariables) {
  const sql = getFDWCreateSql({ wrapper, formState, newTables })

  const { result } = await executeSql({ projectRef, connectionString, sql })

  return result
}

type FDWCreateData = Awaited<ReturnType<typeof createFDW>>

export const useFDWCreateMutation = ({
  onSuccess,
  ...options
}: Omit<UseMutationOptions<FDWCreateData, unknown, FDWCreateVariables>, 'mutationFn'> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<FDWCreateData, unknown, FDWCreateVariables>((vars) => createFDW(vars), {
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries(sqlKeys.query(variables.projectRef, ['fdws']))

      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
