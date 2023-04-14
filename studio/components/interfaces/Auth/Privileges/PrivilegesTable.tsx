import { FC } from 'react'

import Table from 'components/to-be-cleaned/Table'
import { ColumnPrivileges } from 'data/database/privileges-query'
import { Toggle } from 'ui'
import { PRIVILEGE_TYPES } from './Privileges.constants'

interface Props {
  columns: ColumnPrivileges[]
  onToggle: (column: ColumnPrivileges, action: string) => void
}

const PrivilegesTable: FC<Props> = (props) => {
  const handleClickTableHead = (action: string) => {
    const allColumnsHaveAction = props.columns.every((column) => column.privileges.includes(action))

    props.columns.forEach((column) => {
      if (allColumnsHaveAction) {
        props.onToggle(column, action)
      } else if (!column.privileges.includes(action)) {
        props.onToggle(column, action)
      }
    })
  }

  return (
    <Table
      className="table-fixed mb-4"
      head={[
        <Table.th key="header-column">Column</Table.th>,
        ...PRIVILEGE_TYPES.map((action) => (
          <Table.th key={`header-${action}`}>
            <PrivilegeActionButton action={action} onClick={() => handleClickTableHead(action)} />
          </Table.th>
        )),
      ]}
      body={props.columns.map((column) => (
        <Table.tr key={column.name}>
          <Table.td>{column.name}</Table.td>
          {PRIVILEGE_TYPES.map((action) => (
            <Table.td key={action}>
              <Toggle
                checked={column.privileges.includes(action)}
                size="tiny"
                onChange={() => props.onToggle(column, action)}
              />
            </Table.td>
          ))}
        </Table.tr>
      ))}
    />
  )
}

function PrivilegeActionButton(props: { action: string; onClick: () => void }) {
  const formatted = props.action.charAt(0) + props.action.slice(1).toLowerCase()

  return <button onClick={props.onClick}>{formatted}</button>
}

export default PrivilegesTable
