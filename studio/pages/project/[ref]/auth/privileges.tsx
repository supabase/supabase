import { partition } from 'lodash'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'

import { PostgresRole } from '@supabase/postgres-meta'
import { useParams } from 'common/hooks'
import { PrivilegesModal } from 'components/interfaces/Auth/Privileges'
import Privileges from 'components/interfaces/Auth/Privileges/Privileges'
import { PrivilegesState } from 'components/interfaces/Auth/Privileges/Privileges.types'
import {
  arePrivilegesEqual,
  mapDataToPrivilegeColumnUI,
} from 'components/interfaces/Auth/Privileges/Privileges.utils'
import { AuthLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import EmptyPageState from 'components/ui/Error'
import Connecting from 'components/ui/Loading/Loading'
import { usePrivilegesQuery } from 'data/database/privileges-query'
import { useStore } from 'hooks'
import React from 'react'
import { NextPageWithLayout } from 'types'

const PrivilegesPage: NextPageWithLayout = () => {
  const { meta } = useStore()
  const pathParams = useParams()
  const { ref } = useParams()
  const { project } = useProjectContext()

  const tableList = meta.tables.list()
  const schemaList = meta.schemas.list()
  const rolesList = meta.roles.list(
    (role: PostgresRole) => !meta.roles.systemRoles.includes(role.name)
  )

  const [selectedSchema, setSelectedSchema] = useState<string>('public')
  const [selectedRole, setSelectedRole] = useState<string>('anon')

  const tables = tableList
    .filter((table) => table.schema === selectedSchema)
    .map((table) => table.name)

  const [selectedTable, setSelectedTable] = useState<string>(pathParams.table ?? tables[0] ?? '')

  const query = usePrivilegesQuery({
    projectRef: ref,
    connectionString: project?.connectionString,
    schema: selectedSchema,
    table: selectedTable,
    role: selectedRole,
  })
  const [protectedSchemas, openSchemas] = partition(schemaList, (schema) =>
    meta.excludedSchemas.includes(schema?.name ?? '')
  )
  const schema = schemaList.find((schema) => schema.name === selectedSchema)
  const isSchemaLocked = protectedSchemas.some((s) => s.id === schema?.id)

  const roles = rolesList.map((role: PostgresRole) => role.name)

  const [isModalOpen, setModalOpen] = React.useState(false)
  const [data, setData] = React.useState<PrivilegesState>({})

  const handleSuccess = () => {
    setModalOpen(false)
    query.refetch()
  }

  const handleChangeSchema = (schema: string) => {
    const newTable = tableList.find((table) => table.schema === schema)?.name ?? ''
    setSelectedSchema(schema)
    setSelectedTable(newTable)
  }

  const handleChangeRole = (role: string) => {
    setSelectedRole(role)
  }

  if (query.isError) {
    return <EmptyPageState error={query.error} />
  }

  if (query.isLoading) {
    return <Connecting />
  }

  const table = tableList.find((table) => table.name === selectedTable)

  const columnsServerState = mapDataToPrivilegeColumnUI(
    query.data,
    table?.columns?.map((c) => c.name) ?? []
  )
  const columnsState = data[selectedSchema]?.[selectedRole]?.[selectedTable] ?? columnsServerState

  const changes = {
    schema: selectedSchema,
    role: selectedRole,
    table: selectedTable,
    columns: columnsState,
  }

  const hasChanges = !arePrivilegesEqual(columnsState, columnsServerState)

  const handleChangePrivileges = (table: string, columnName: string, privileges: string[]) => {
    setData((data) => {
      const columns = data[selectedSchema]?.[selectedRole]?.[table] ?? columnsServerState

      return {
        ...data,
        [selectedSchema]: {
          ...data[selectedSchema],
          [selectedRole]: {
            ...data[selectedSchema]?.[selectedRole],
            [table]: columns.map((column) =>
              column.name === columnName ? { ...column, privileges } : column
            ),
          },
        },
      }
    })
  }

  return (
    <>
      <Privileges
        columns={columnsState}
        tables={tables}
        selectedSchema={selectedSchema}
        selectedRole={selectedRole}
        selectedTable={table}
        availableSchemas={schemaList.map((s) => s.name)}
        openSchemas={openSchemas}
        protectedSchemas={protectedSchemas}
        roles={roles}
        isSchemaLocked={isSchemaLocked}
        hasChanges={hasChanges}
        onChangeSchema={handleChangeSchema}
        onChangeRole={handleChangeRole}
        onChangeTable={setSelectedTable}
        onChangePrivileges={handleChangePrivileges}
        onReset={() => setData({})}
        onClickSave={() => setModalOpen(true)}
      />
      <PrivilegesModal
        visible={isModalOpen}
        original={query.data}
        changes={changes}
        onCancel={() => setModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  )
}

PrivilegesPage.getLayout = (page) => (
  <AuthLayout title="Auth">
    <div className="h-full p-4">{page}</div>
  </AuthLayout>
)

export default observer(PrivilegesPage)
