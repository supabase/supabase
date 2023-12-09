import { PostgresRole } from '@supabase/postgres-meta'
import { partition } from 'lodash'
import { observer } from 'mobx-react-lite'
import { useMemo, useState } from 'react'

import { useParams } from 'common/hooks'
import Privileges from 'components/interfaces/Database/Privileges/Privileges'
import { mapDataToPrivilegeColumnUI } from 'components/interfaces/Database/Privileges/Privileges.utils'
import { DatabaseLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import EmptyPageState from 'components/ui/Error'
import Connecting from 'components/ui/Loading/Loading'
import { useColumnPrivilegesQuery } from 'data/privileges/column-privileges-query'
import { useStore } from 'hooks'
import { NextPageWithLayout } from 'types'
import { useTablePrivilegesQuery } from 'data/privileges/table-privileges-query'
import { useFlag } from 'hooks'
import { useRouter } from 'next/router'
import { useSchemasQuery } from 'data/database/schemas-query'
import { EXCLUDED_SCHEMAS } from 'lib/constants/schemas'
import { useTablesQuery } from 'data/tables/tables-query'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'

const PrivilegesPage: NextPageWithLayout = () => {
  const { meta } = useStore()

  const pathParams = useParams()
  const { ref } = useParams()
  const { project } = useProjectContext()
  const router = useRouter()
  console.log(project)

  const { data: tableList, isLoading: isLoadingTables } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  //const schemaList = meta.schemas.list()
  const { data: schemas } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const rolesList = meta.roles.list(
    (role: PostgresRole) => !meta.roles.systemRoles.includes(role.name)
  )
  const columnLevelPrivileges = useFlag('columnLevelPrivileges')

  const [selectedSchema, setSelectedSchema] = useState<string>('public')
  const [selectedRole, setSelectedRole] = useState<string>('anon')

  const tables = tableList
    ?.filter((table) => table.schema === selectedSchema)
    .map((table) => table.name)

  const [selectedTable, setSelectedTable] = useState<string>(pathParams.table ?? tables?.[0] ?? '')

  const {
    data: allTablePrivileges,
    isLoading: isLoadingTablePrivileges,
    isError: isErrorTablePrivileges,
    error: errorTablePrivileges,
  } = useTablePrivilegesQuery(
    {
      projectRef: ref,
      connectionString: project?.connectionString,
    },
    {
      enabled: !!project,
    }
  )

  const tablePrivileges = useMemo(
    () =>
      allTablePrivileges
        ?.find(
          (tablePrivilege) =>
            tablePrivilege.schema === selectedSchema && tablePrivilege.name === selectedTable
        )
        ?.privileges.filter((privilege) => privilege.grantee === selectedRole) ?? [],
    [allTablePrivileges, selectedRole, selectedSchema, selectedTable]
  )

  const {
    data: columnPrivileges,
    isLoading: isLoadingColumnPrivileges,
    isError: isErrorColumnPrivileges,
    error: errorColumnPrivileges,
  } = useColumnPrivilegesQuery(
    {
      projectRef: ref,
      connectionString: project?.connectionString,
    },
    {
      enabled: !!project,
    }
  )

  const [protectedSchemas, openSchemas] = partition(schemas ?? [], (schema) =>
    EXCLUDED_SCHEMAS.includes(schema?.name ?? '')
  )
  const schema = schemas?.find((schema) => schema.name === selectedSchema)
  const isSchemaLocked = protectedSchemas.some((s) => s.id === schema?.id)

  const roles = rolesList.map((role: PostgresRole) => role.name)

  const handleChangeSchema = (schema: string) => {
    const newTable = tableList?.find((table) => table.schema === schema)?.name ?? ''
    setSelectedSchema(schema)
    setSelectedTable(newTable)
  }

  const handleChangeRole = (role: string) => {
    setSelectedRole(role)
  }

  const columnsState = useMemo(
    () => mapDataToPrivilegeColumnUI(columnPrivileges, selectedSchema, selectedTable, selectedRole),
    [columnPrivileges, selectedRole, selectedSchema, selectedTable]
  )

  if (isErrorTablePrivileges || isErrorColumnPrivileges) {
    return <EmptyPageState error={errorTablePrivileges || errorColumnPrivileges} />
  }

  if (isLoadingTablePrivileges || isLoadingColumnPrivileges || isLoadingTables) {
    return <Connecting />
  }

  if (!columnLevelPrivileges) {
    router.push(`/project/${ref}/database/tables`)
  }

  const table = tableList?.find((table) => table.name === selectedTable)
  return (
    <>
      {columnLevelPrivileges ? (
        <ScaffoldContainer>
          <ScaffoldSection>
            <Privileges
              tablePrivileges={tablePrivileges}
              columns={columnsState}
              tables={tables || []}
              selectedSchema={selectedSchema}
              selectedRole={selectedRole}
              selectedTable={table}
              availableSchemas={schemas?.map((s) => s.name) || []}
              openSchemas={openSchemas}
              protectedSchemas={protectedSchemas}
              roles={roles}
              isSchemaLocked={isSchemaLocked}
              onChangeSchema={handleChangeSchema}
              onChangeRole={handleChangeRole}
              onChangeTable={setSelectedTable}
            />
          </ScaffoldSection>
        </ScaffoldContainer>
      ) : (
        <Connecting />
      )}
    </>
  )
}

PrivilegesPage.getLayout = (page) => (
  <DatabaseLayout title="Database">
    <div>{page}</div>
  </DatabaseLayout>
)

export default observer(PrivilegesPage)
