import { PostgresSchema, PostgresTable } from '@supabase/postgres-meta'
import { PrivilegesData } from 'data/database/privileges-query'
import React from 'react'
import { PrivilegesDataUI } from './Privileges.types'
import { arePrivilegesEqual } from './Privileges.utils'
import PrivilegesBody from './PrivilegesBody'
import PrivilegesFooter from './PrivilegesFooter'
import PrivilegesHead from './PrivilegesHead'
import PrivilegesModal from './PrivilegesModal'

interface Props {
  data: PrivilegesData
  dataUI: PrivilegesDataUI
  tables: string[]
  selectedSchema: string
  selectedRole: string
  availableSchemas: string[]
  openSchemas: PostgresSchema[]
  protectedSchemas: PostgresSchema[]
  roles: string[]
  isSchemaLocked: boolean
  selectedTable?: PostgresTable
  hasTables: boolean
  onChangeSchema: (schema: string) => void
  onChangeRole: (role: string) => void
  onChangeTable: (table: string) => void
  onRefetch: () => void
}

function Privileges(props: Props) {
  const [data, setData] = React.useState<PrivilegesDataUI>(props.dataUI)
  const [isModalOpen, setModalOpen] = React.useState(false)

  const handleChangePrivileges = (table: string, columnName: string, privileges: string[]) => {
    setData((data) => ({
      ...data,
      [props.selectedSchema]: {
        ...data[props.selectedSchema],
        [props.selectedRole]: {
          ...data[props.selectedSchema][props.selectedRole],
          [table]: data[props.selectedSchema][props.selectedRole][table].map((column) =>
            column.name === columnName ? { ...column, privileges } : column
          ),
        },
      },
    }))
  }

  const handleReset = () => setData(props.dataUI)

  const handleSuccess = () => {
    setModalOpen(false)
    props.onRefetch()
  }

  const hasChanges = !arePrivilegesEqual(props.dataUI, data)

  return (
    <>
      <div className="flex flex-col h-full">
        <PrivilegesHead
          selectedSchema={props.selectedSchema}
          selectedRole={props.selectedRole}
          selectedTable={props.selectedTable}
          tables={props.tables}
          availableSchemas={props.availableSchemas}
          openSchemas={props.openSchemas}
          protectedSchemas={props.protectedSchemas}
          roles={props.roles}
          isSchemaLocked={props.isSchemaLocked}
          onChangeSchema={props.onChangeSchema}
          onChangeRole={props.onChangeRole}
          onChangeTable={props.onChangeTable}
        />
        <PrivilegesBody
          privileges={data[props.selectedSchema][props.selectedRole]}
          table={props.selectedTable}
          hasChanges={hasChanges}
          onChange={handleChangePrivileges}
        />
        <PrivilegesFooter
          hasChanges={hasChanges}
          onReset={handleReset}
          onClickSave={() => setModalOpen(true)}
        />
      </div>
      <PrivilegesModal
        visible={isModalOpen}
        original={props.data}
        changes={data}
        onCancel={() => setModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  )
}

export default Privileges
