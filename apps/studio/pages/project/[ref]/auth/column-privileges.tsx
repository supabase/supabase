import { PostgresRole } from '@supabase/postgres-meta'
import { observer } from 'mobx-react-lite'
import { useMemo, useState } from 'react'

import { useParams } from 'common/hooks'
import Privileges from 'components/interfaces/Database/Privileges/Privileges'
import { mapDataToPrivilegeColumnUI } from 'components/interfaces/Database/Privileges/Privileges.utils'
import { AuthLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import EmptyPageState from 'components/ui/Error'
import Connecting from 'components/ui/Loading/Loading'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useColumnPrivilegesQuery } from 'data/privileges/column-privileges-query'
import { useTablePrivilegesQuery } from 'data/privileges/table-privileges-query'
import { useTablesQuery } from 'data/tables/tables-query'
import { useStore } from 'hooks'
import { EXCLUDED_SCHEMAS } from 'lib/constants/schemas'
import { NextPageWithLayout } from 'types'

const EDITABLE_ROLES = ['authenticated', 'anon', 'service_role']

const PrivilegesPage: NextPageWithLayout = () => {
  const { meta } = useStore()

  const pathParams = useParams()
  const { project } = useProjectContext()

  const { data: tableList, isLoading: isLoadingTables } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { data: allSchemas } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const rolesList = meta.roles.list((role: PostgresRole) => EDITABLE_ROLES.includes(role.name))

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
  } = useTablePrivilegesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

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
  } = useColumnPrivilegesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const schemas = allSchemas?.filter((schema) => !EXCLUDED_SCHEMAS.includes(schema.name)) ?? []

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

  const table = tableList?.find((table) => table.name === selectedTable)
  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <Privileges
          tablePrivileges={tablePrivileges}
          columns={columnsState}
          tables={tables || []}
          selectedSchema={selectedSchema}
          selectedRole={selectedRole}
          selectedTable={table}
          schemas={schemas}
          roles={roles}
          onChangeSchema={handleChangeSchema}
          onChangeRole={handleChangeRole}
          onChangeTable={setSelectedTable}
        />
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

PrivilegesPage.getLayout = (page) => (
  <AuthLayout title="Column Privileges">
    <div>{page}</div>
  </AuthLayout>
)

export default observer(PrivilegesPage)
