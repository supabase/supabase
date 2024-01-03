import { PostgresRole } from '@supabase/postgres-meta'
import Link from 'next/link'
import { useCallback, useMemo, useState } from 'react'

import { useParams } from 'common/hooks'
import PrivilegesHead from 'components/interfaces/Database/Privileges/PrivilegesHead'
import PrivilegesTable from 'components/interfaces/Database/Privileges/PrivilegesTable'
import { AuthLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import EmptyPageState from 'components/ui/Error'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useDatabaseRolesQuery } from 'data/database-roles/database-roles-query'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useColumnPrivilegesQuery } from 'data/privileges/column-privileges-query'
import { useTablePrivilegesQuery } from 'data/privileges/table-privileges-query'
import { useTablesQuery } from 'data/tables/tables-query'
import { EXCLUDED_SCHEMAS } from 'lib/constants/schemas'
import { NextPageWithLayout } from 'types'
import { Button, IconExternalLink } from 'ui'
import AlertError from 'components/ui/AlertError'
import {
  getDefaultColumnCheckedStates,
  getDefaultTableCheckedStates,
  useApplyPrivilegeOperations,
  usePrivilegesState,
} from 'components/interfaces/Database/Privileges/Privileges.utils'

const EDITABLE_ROLES = ['authenticated', 'anon', 'service_role']

const PrivilegesPage: NextPageWithLayout = () => {
  const pathParams = useParams()
  const { project } = useProjectContext()

  const [selectedSchema, setSelectedSchema] = useState<string>('public')
  const [selectedTable, setSelectedTable] = useState<string | undefined>(pathParams.table)
  const [selectedRole, setSelectedRole] = useState<string>('authenticated')

  const { data: tableList, isLoading: isLoadingTables } = useTablesQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    {
      onSuccess(data) {
        const tables = data
          .filter((table) => table.schema === selectedSchema)
          .map((table) => table.name)

        if (tables[0] && selectedTable === undefined) {
          setSelectedTable(tables[0])
        }
      },
    }
  )

  const { data: allSchemas, isLoading: isLoadingSchemas } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { data: allRoles, isLoading: isLoadingRoles } = useDatabaseRolesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const tables = tableList
    ?.filter((table) => table.schema === selectedSchema)
    .map((table) => table.name)

  const {
    data: allTablePrivileges,
    isLoading: isLoadingTablePrivileges,
    isError: isErrorTablePrivileges,
    error: errorTablePrivileges,
  } = useTablePrivilegesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const tablePrivilege = useMemo(() => {
    const tablePrivilege = allTablePrivileges?.find(
      (tablePrivilege) =>
        tablePrivilege.schema === selectedSchema && tablePrivilege.name === selectedTable
    )

    if (tablePrivilege) {
      return {
        ...tablePrivilege,
        privileges: tablePrivilege.privileges.filter(
          (privilege) => privilege.grantee === selectedRole
        ),
      }
    }
  }, [allTablePrivileges, selectedRole, selectedSchema, selectedTable])

  const {
    data: allColumnPrivileges,
    isLoading: isLoadingColumnPrivileges,
    isError: isErrorColumnPrivileges,
    error: errorColumnPrivileges,
  } = useColumnPrivilegesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const columnPrivileges = useMemo(
    () =>
      allColumnPrivileges
        ?.filter(
          (privilege) =>
            privilege.relation_schema === selectedSchema &&
            privilege.relation_name === selectedTable
        )
        .map((privilege) => ({
          ...privilege,
          privileges: privilege.privileges.filter(
            (privilege) => privilege.grantee === selectedRole
          ),
        })) ?? [],
    [allColumnPrivileges, selectedRole, selectedSchema, selectedTable]
  )

  const schemas = allSchemas?.filter((schema) => !EXCLUDED_SCHEMAS.includes(schema.name)) ?? []

  const rolesList =
    allRoles?.filter((role: PostgresRole) => EDITABLE_ROLES.includes(role.name)) ?? []
  const roles = rolesList.map((role: PostgresRole) => role.name)

  const table = tableList?.find((table) => table.name === selectedTable)

  const {
    tableCheckedStates,
    columnCheckedStates,
    toggleTablePrivilege,
    toggleColumnPrivilege,
    operations,
    resetOperations,
  } = usePrivilegesState(
    useMemo(
      () => ({
        tableId: table?.id ?? -1,
        role: selectedRole,
        defaultTableCheckedStates: tablePrivilege
          ? getDefaultTableCheckedStates(tablePrivilege)
          : {},
        defaultColumnCheckedStates: getDefaultColumnCheckedStates(columnPrivileges),
      }),
      [columnPrivileges, selectedRole, table?.id, tablePrivilege]
    )
  )

  const hasChanges = operations.length > 0

  const handleChangeSchema = (schema: string) => {
    if (hasChanges) {
      if (window.confirm('You will lose your changes. Are you sure?')) {
        resetOperations()
      } else {
        return
      }
    }

    const newTable = tableList?.find((table) => table.schema === schema)?.name
    setSelectedSchema(schema)
    setSelectedTable(newTable)
  }

  const handleChangeTable = (table: string) => {
    if (hasChanges) {
      if (window.confirm('You will lose your changes. Are you sure?')) {
        resetOperations()
      } else {
        return
      }
    }

    setSelectedTable(table)
  }

  const handleChangeRole = (role: string) => {
    setSelectedRole(role)
  }

  const { apply: applyColumnPrivileges, isLoading: isApplyingChanges } =
    useApplyPrivilegeOperations(
      useCallback(() => {
        resetOperations()
      }, [resetOperations])
    )

  function applyChanges() {
    applyColumnPrivileges(operations)
  }

  const isLoading =
    isLoadingTablePrivileges ||
    isLoadingColumnPrivileges ||
    isLoadingTables ||
    isLoadingSchemas ||
    isLoadingRoles

  const isError = isErrorTablePrivileges || isErrorColumnPrivileges

  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <div className="col-span-12">
          <div className="flex items-center justify-between mb-6 gap-12">
            <div>
              <h3 className="mb-1 text-xl">Column-level privileges</h3>

              <div className="text-sm text-lighter">
                <p>Grant or revoke privileges on a column based on user role.</p>
                <p>This is an advanced feature and should be used with caution.</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                <Link
                  href="https://supabase.com/docs/guides/guides/auth/column-level-security"
                  target="_blank"
                  rel="noreferrer"
                >
                  Documentation
                </Link>
              </Button>
            </div>
          </div>
          <PrivilegesHead
            selectedSchema={selectedSchema}
            selectedRole={selectedRole}
            selectedTable={table}
            tables={tables ?? []}
            schemas={schemas}
            roles={roles}
            onChangeSchema={handleChangeSchema}
            onChangeRole={handleChangeRole}
            onChangeTable={handleChangeTable}
            applyChanges={applyChanges}
            resetChanges={resetOperations}
            hasChanges={hasChanges}
            isApplyingChanges={isApplyingChanges}
          />
          {isLoading ? (
            <GenericSkeletonLoader />
          ) : isError ? (
            <AlertError error={errorTablePrivileges || errorColumnPrivileges} />
          ) : table && tablePrivilege ? (
            <>
              <PrivilegesTable
                columnPrivileges={columnPrivileges}
                tableCheckedStates={tableCheckedStates}
                columnCheckedStates={columnCheckedStates}
                toggleTablePrivilege={toggleTablePrivilege}
                toggleColumnPrivilege={toggleColumnPrivilege}
                isApplyingChanges={isApplyingChanges}
              />
              <p className="text-xs text-right text-light">
                <strong>Warning: </strong>
                Changing column privileges can break existing queries
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 ">
              <p className="text-foreground-light">Select a table to edit privileges</p>
            </div>
          )}
        </div>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

PrivilegesPage.getLayout = (page) => <AuthLayout title="Column Privileges">{page}</AuthLayout>

export default PrivilegesPage
