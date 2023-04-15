import { FC } from 'react'

import Table from 'components/to-be-cleaned/Table'
import { Toggle } from 'ui'
import { PRIVILEGE_TYPES } from './Privileges.constants'
import { PrivilegeColumnUI } from './Privileges.types'

interface Props {
  columns: PrivilegeColumnUI[]
  onToggle: (column: PrivilegeColumnUI, privileges: string[]) => void
}

const PrivilegesTable: FC<Props> = (props) => {
  const handleClickPrivilege = (privilege: string) => {
    const allColumnsHavePrivilege = props.columns.every((column) =>
      column.privileges.includes(privilege)
    )

    props.columns.forEach((column) => {
      if (allColumnsHavePrivilege) {
        props.onToggle(column, [privilege])
      } else if (!column.privileges.includes(privilege)) {
        props.onToggle(column, [privilege])
      }
    })
  }

  const handleClickColumnName = (column: PrivilegeColumnUI) => {
    const hasAllPriviliges = PRIVILEGE_TYPES.every((privilege) =>
      column.privileges.includes(privilege)
    )

    if (hasAllPriviliges) {
      props.onToggle(column, PRIVILEGE_TYPES)
    } else {
      props.onToggle(
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
      body={props.columns.map((column) => (
        <Table.tr key={column.name}>
          <Table.td>
            <button onClick={() => handleClickColumnName(column)}>{column.name}</button>
          </Table.td>
          {PRIVILEGE_TYPES.map((privilege) => (
            <Table.td key={privilege}>
              <Toggle
                checked={column.privileges.includes(privilege)}
                size="tiny"
                onChange={() => props.onToggle(column, [privilege])}
              />
            </Table.td>
          ))}
        </Table.tr>
      ))}
    />
  )
}

function PrivilegeButton(props: { privilege: string; onClick: () => void }) {
  const formatted = props.privilege.charAt(0) + props.privilege.slice(1).toLowerCase()

  return <button onClick={props.onClick}>{formatted}</button>
}

export default PrivilegesTable
