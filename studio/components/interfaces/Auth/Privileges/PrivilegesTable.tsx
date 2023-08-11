import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import Table from 'components/to-be-cleaned/Table'
import { useColumnPrivilegesGrantMutation } from 'data/privileges/column-privileges-grant-mutation'
import { useColumnPrivilegesRevokeMutation } from 'data/privileges/column-privileges-revoke-mutation'
import { useTablePrivilegesGrantMutation } from 'data/privileges/table-privileges-grant-mutation'
import { useTablePrivilegesRevokeMutation } from 'data/privileges/table-privileges-revoke-mutation'
import { Toggle } from 'ui'
import {
  COLUMN_PRIVILEGE_TYPES,
  ColumnPrivilegeType,
  TABLE_PRIVILEGE_TYPES,
  TablePrivilegeType,
} from './Privileges.constants'
import { PrivilegeColumnUI, TablePrivilegesUI } from './Privileges.types'

export interface PrivilegesTableProps {
  tableId: number
  tablePrivileges: TablePrivilegesUI[]
  columns: PrivilegeColumnUI[]
  role: string
}

const PrivilegesTable = ({ tableId, tablePrivileges, columns, role }: PrivilegesTableProps) => {
  const { project } = useProjectContext()

  const { mutate: grantTable } = useTablePrivilegesGrantMutation()
  const { mutate: revokeTable } = useTablePrivilegesRevokeMutation()

  const onToggleTable = (privileges: readonly TablePrivilegeType[], shouldGrant = true) => {
    if (!project) return console.error('No project found')

    if (shouldGrant) {
      grantTable({
        projectRef: project.ref,
        connectionString: project.connectionString,
        grants: privileges.map((privilege) => ({
          relation_id: tableId,
          grantee: role,
          privilege_type: privilege,
        })),
      })
    } else {
      revokeTable({
        projectRef: project.ref,
        connectionString: project.connectionString,
        revokes: privileges.map((privilege) => ({
          relation_id: tableId,
          grantee: role,
          privilege_type: privilege,
        })),
      })
    }
  }

  const { mutate: grantColumn } = useColumnPrivilegesGrantMutation()
  const { mutate: revokeColumn } = useColumnPrivilegesRevokeMutation()

  const onToggleColumn = (
    column: PrivilegeColumnUI,
    privileges: readonly ColumnPrivilegeType[],
    shouldGrant = true
  ) => {
    if (!project) return console.error('No project found')

    if (shouldGrant) {
      grantColumn({
        projectRef: project.ref,
        connectionString: project.connectionString,
        grants: privileges.map((privilege) => ({
          column_id: column.id,
          grantee: role,
          privilege_type: privilege,
        })),
      })
    } else {
      revokeColumn({
        projectRef: project.ref,
        connectionString: project.connectionString,
        revokes: privileges.map((privilege) => ({
          column_id: column.id,
          grantee: role,
          privilege_type: privilege,
        })),
      })
    }
  }

  const handleClickPrivilege = (privilege: ColumnPrivilegeType) => {
    const allColumnsHavePrivilege = columns.every((column) => column.privileges.includes(privilege))

    columns.forEach((column) => {
      if (allColumnsHavePrivilege) {
        onToggleColumn(column, [privilege], false)
      } else if (!column.privileges.includes(privilege)) {
        onToggleColumn(column, [privilege], true)
      }
    })
  }

  const handleClickColumnName = (column: PrivilegeColumnUI) => {
    const hasAllPrivileges = COLUMN_PRIVILEGE_TYPES.every((privilege) =>
      column.privileges.includes(privilege)
    )

    if (hasAllPrivileges) {
      onToggleColumn(column, COLUMN_PRIVILEGE_TYPES, false)
    } else {
      onToggleColumn(
        column,
        COLUMN_PRIVILEGE_TYPES.filter((privilege) => !column.privileges.includes(privilege)),
        true
      )
    }
  }

  return (
    <Table
      className="table-fixed mb-4"
      head={[
        <Table.th key="header-column"></Table.th>,
        ...TABLE_PRIVILEGE_TYPES.map((privilege) => {
          const checked = tablePrivileges.find((p) => p.privilege_type === privilege) !== undefined

          return (
            <Table.th key={`header-${privilege}`}>
              <div className="flex items-baseline gap-2">
                <PrivilegeButton
                  privilege={privilege}
                  onClick={() => {
                    if (COLUMN_PRIVILEGE_TYPES.includes(privilege as any)) {
                      handleClickPrivilege(privilege as ColumnPrivilegeType)
                    }
                  }}
                />

                <Toggle
                  checked={checked}
                  onChange={() => onToggleTable([privilege], !checked)}
                  size="tiny"
                />
              </div>
            </Table.th>
          )
        }),
      ]}
      body={columns.map((column) => (
        <Table.tr key={column.name}>
          <Table.td>
            <button onClick={() => handleClickColumnName(column)}>{column.name}</button>
          </Table.td>
          {TABLE_PRIVILEGE_TYPES.map((privilege) => {
            const checked = column.privileges.includes(privilege)
            const disabled =
              tablePrivileges.find((p) => p.privilege_type === privilege) !== undefined

            return (
              <Table.td key={privilege}>
                {COLUMN_PRIVILEGE_TYPES.includes(privilege as any) && (
                  <Toggle
                    checked={checked}
                    onChange={() =>
                      onToggleColumn(column, [privilege as ColumnPrivilegeType], !checked)
                    }
                    disabled={disabled}
                    size="tiny"
                  />
                )}
              </Table.td>
            )
          })}
        </Table.tr>
      ))}
    />
  )
}

const PrivilegeButton = ({ privilege, onClick }: { privilege: string; onClick: () => void }) => {
  const formatted = privilege.charAt(0) + privilege.slice(1).toLowerCase()

  return <button onClick={onClick}>{formatted}</button>
}

export default PrivilegesTable
