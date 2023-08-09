import { PostgresRole } from '@supabase/postgres-meta'
import { partition } from 'lodash'
import { observer } from 'mobx-react-lite'
import { useMemo, useState } from 'react'

import { useParams } from 'common/hooks'
import Privileges from 'components/interfaces/Auth/Privileges/Privileges'
import { mapDataToPrivilegeColumnUI } from 'components/interfaces/Auth/Privileges/Privileges.utils'
import { AuthLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import EmptyPageState from 'components/ui/Error'
import Connecting from 'components/ui/Loading/Loading'
import { usePrivilegesQuery } from 'data/database/privileges-query'
import { useStore } from 'hooks'
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

  const {
    data: privileges,
    isLoading,
    isError,
    error,
  } = usePrivilegesQuery({
    projectRef: ref,
    connectionString: project?.connectionString,
  })
  const [protectedSchemas, openSchemas] = partition(schemaList, (schema) =>
    meta.excludedSchemas.includes(schema?.name ?? '')
  )
  const schema = schemaList.find((schema) => schema.name === selectedSchema)
  const isSchemaLocked = protectedSchemas.some((s) => s.id === schema?.id)

  const roles = rolesList.map((role: PostgresRole) => role.name)

  const handleChangeSchema = (schema: string) => {
    const newTable = tableList.find((table) => table.schema === schema)?.name ?? ''
    setSelectedSchema(schema)
    setSelectedTable(newTable)
  }

  const handleChangeRole = (role: string) => {
    setSelectedRole(role)
  }

  const columnsState = useMemo(
    () => mapDataToPrivilegeColumnUI(privileges, selectedSchema, selectedTable, selectedRole),
    [privileges, selectedRole, selectedSchema, selectedTable]
  )

  if (isError) {
    return <EmptyPageState error={error} />
  }

  if (isLoading) {
    return <Connecting />
  }

  const table = tableList.find((table) => table.name === selectedTable)

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
        onChangeSchema={handleChangeSchema}
        onChangeRole={handleChangeRole}
        onChangeTable={setSelectedTable}
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
