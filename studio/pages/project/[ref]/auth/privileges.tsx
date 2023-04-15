import { partition } from 'lodash'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'

import { useParams } from 'common/hooks'
import Privileges from 'components/interfaces/Auth/Privileges/Privileges'
import { mapToUIPrivilegesData } from 'components/interfaces/Auth/Privileges/Privileges.utils'
import { AuthLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import Connecting from 'components/ui/Loading/Loading'
import { usePrivilegesQuery } from 'data/database/privileges-query'
import { useStore } from 'hooks'
import { NextPageWithLayout } from 'types'

const PrivilegesPage: NextPageWithLayout = () => {
  const { meta } = useStore()
  const pathParams = useParams()
  const [selectedSchema, setSelectedSchema] = useState<string>('public')
  const [selectedRole, setSelectedRole] = useState<string>('anon')
  const tables = meta.tables.list((table: { schema: string }) => table.schema === selectedSchema)
  const [selectedTable, setSelectedTable] = useState<string>(
    pathParams.table ?? tables[0]?.name ?? ''
  )
  const { ref } = useParams()
  const { project } = useProjectContext()
  const query = usePrivilegesQuery({
    projectRef: ref,
    connectionString: project?.connectionString,
  })
  const schemas = meta.schemas.list()
  const [protectedSchemas, openSchemas] = partition(schemas, (schema) =>
    meta.excludedSchemas.includes(schema?.name ?? '')
  )
  const schema = schemas.find((schema) => schema.name === selectedSchema)
  const isSchemaLocked = protectedSchemas.some((s) => s.id === schema?.id)
  const table = tables.find((table) => table.name === selectedTable)

  if (query.isError) {
    return <div>Error</div>
  }

  if (query.isLoading) {
    return <Connecting />
  }

  const handleChangeSchema = (schema: string) => {
    const newRole = Object.keys(query.data[schema])[0]
    const newTable = Object.keys(query.data[schema][newRole])[0]
    setSelectedSchema(schema)
    setSelectedRole(newRole)
    setSelectedTable(newTable)
  }

  const handleChangeRole = (role: string) => {
    setSelectedRole(role)
  }

  return (
    <Privileges
      data={query.data}
      dataUI={mapToUIPrivilegesData(query.data)}
      tables={tables.map((t) => t.name)}
      selectedSchema={selectedSchema}
      selectedRole={selectedRole}
      selectedTable={table}
      availableSchemas={Object.keys(query.data)}
      openSchemas={openSchemas}
      protectedSchemas={protectedSchemas}
      roles={Object.keys(query.data[selectedSchema])}
      isSchemaLocked={isSchemaLocked}
      hasTables={tables.length > 0}
      onChangeSchema={handleChangeSchema}
      onChangeRole={handleChangeRole}
      onChangeTable={setSelectedTable}
      onRefetch={() => query.refetch()}
    />
  )
}

PrivilegesPage.getLayout = (page) => (
  <AuthLayout title="Auth">
    <div className="h-full p-4">{page}</div>
  </AuthLayout>
)

export default observer(PrivilegesPage)
