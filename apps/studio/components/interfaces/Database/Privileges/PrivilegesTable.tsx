import Table from 'components/to-be-cleaned/Table'
import type { ColumnPrivilege } from 'data/privileges/column-privileges-query'
import { Switch } from 'ui'
import {
  ALL_PRIVILEGE_TYPES,
  COLUMN_PRIVILEGE_TYPES,
  TABLE_PRIVILEGE_TYPES,
} from './Privileges.constants'
import { usePrivilegesState } from './Privileges.utils'

export interface PrivilegesTableProps
  extends Pick<
    ReturnType<typeof usePrivilegesState>,
    'tableCheckedStates' | 'columnCheckedStates' | 'toggleTablePrivilege' | 'toggleColumnPrivilege'
  > {
  columnPrivileges: ColumnPrivilege[]
  disabled: boolean
  isApplyingChanges?: boolean
}

const PrivilegesTable = ({
  columnPrivileges,
  tableCheckedStates,
  columnCheckedStates,
  toggleTablePrivilege,
  toggleColumnPrivilege,
  disabled,
  isApplyingChanges = false,
}: PrivilegesTableProps) => {
  const handleClickColumnName = (columnId: string) => {
    const hasAllPrivileges = COLUMN_PRIVILEGE_TYPES.every(
      (privilege) => columnCheckedStates[columnId][privilege]
    )
    const privilegesToToggle = COLUMN_PRIVILEGE_TYPES.filter((privilege) =>
      hasAllPrivileges
        ? columnCheckedStates[columnId][privilege]
        : !columnCheckedStates[columnId][privilege]
    )

    privilegesToToggle.forEach((privilege) => {
      toggleColumnPrivilege(columnId, privilege)
    })
  }

  return (
    <Table
      className="table-fixed mb-4"
      head={[
        <Table.th key="header-column">
          <span>Column</span>
        </Table.th>,
        ...ALL_PRIVILEGE_TYPES.map((privilege) => {
          const checked = tableCheckedStates[privilege]

          return (
            <Table.th key={`header-${privilege}`}>
              <div className="inline-flex items-center gap-2">
                <span>{privilege.charAt(0) + privilege.slice(1).toLowerCase()}</span>

                <Switch
                  checked={checked}
                  onCheckedChange={() => {
                    toggleTablePrivilege(privilege)
                  }}
                  disabled={disabled || isApplyingChanges}
                />
              </div>
            </Table.th>
          )
        }),
      ]}
      body={columnPrivileges.map((column) => (
        <Table.tr key={column.column_id}>
          <Table.td>
            <button
              onClick={() => handleClickColumnName(column.column_id)}
              className="block w-full truncate text-left text-foreground"
            >
              {column.column_name}
            </button>
          </Table.td>
          {COLUMN_PRIVILEGE_TYPES.map((privilege) => {
            const checked = columnCheckedStates[column.column_id][privilege]

            return (
              <Table.td key={privilege}>
                {COLUMN_PRIVILEGE_TYPES.includes(privilege as any) && (
                  <div className="ml-5 inline-flex">
                    <Switch
                      checked={checked}
                      onCheckedChange={() => {
                        toggleColumnPrivilege(column.column_id, privilege)
                      }}
                      disabled={disabled || isApplyingChanges}
                    />
                  </div>
                )}
              </Table.td>
            )
          })}
          {TABLE_PRIVILEGE_TYPES.map((privilege) => {
            return (
              <Table.td key={privilege}>
                <span className="ml-5 text-xs text-foreground-lighter">N/A</span>
              </Table.td>
            )
          })}
        </Table.tr>
      ))}
    />
  )
}

export default PrivilegesTable
