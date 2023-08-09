import Table from 'components/to-be-cleaned/Table'
import { Toggle } from 'ui'
import { PRIVILEGE_TYPES } from './Privileges.constants'
import { PrivilegeColumnUI } from './Privileges.types'

export interface PrivilegesTableProps {
  columns: PrivilegeColumnUI[]
  // onToggle: (column: PrivilegeColumnUI, privileges: string[]) => void
}

const PrivilegesTable = ({ columns }: PrivilegesTableProps) => {
  const onToggle = (column: PrivilegeColumnUI, privileges: string[]) => {
    // TODO: implement
  }

  const handleClickPrivilege = (privilege: string) => {
    const allColumnsHavePrivilege = columns.every((column) => column.privileges.includes(privilege))

    columns.forEach((column) => {
      if (allColumnsHavePrivilege) {
        onToggle(column, [privilege])
      } else if (!column.privileges.includes(privilege)) {
        onToggle(column, [privilege])
      }
    })
  }

  const handleClickColumnName = (column: PrivilegeColumnUI) => {
    const hasAllPrivileges = PRIVILEGE_TYPES.every((privilege) =>
      column.privileges.includes(privilege)
    )

    if (hasAllPrivileges) {
      onToggle(column, PRIVILEGE_TYPES)
    } else {
      onToggle(
        column,
        PRIVILEGE_TYPES.filter((privilege) => !column.privileges.includes(privilege))
      )
    }
  }

  return (
    <Table
      className="table-fixed mb-4"
      head={[
        <Table.th key="header-column">Column</Table.th>,
        ...PRIVILEGE_TYPES.map((privilege) => (
          <Table.th key={`header-${privilege}`}>
            <PrivilegeButton
              privilege={privilege}
              onClick={() => handleClickPrivilege(privilege)}
            />
          </Table.th>
        )),
      ]}
      body={columns.map((column) => (
        <Table.tr key={column.name}>
          <Table.td>
            <button onClick={() => handleClickColumnName(column)}>{column.name}</button>
          </Table.td>
          {PRIVILEGE_TYPES.map((privilege) => (
            <Table.td key={privilege}>
              <Toggle
                checked={column.privileges.includes(privilege)}
                size="tiny"
                onChange={() => onToggle(column, [privilege])}
              />
            </Table.td>
          ))}
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
