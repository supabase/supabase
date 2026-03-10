import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import {
  useFeaturePreviewModal,
  useIsColumnLevelPrivilegesEnabled,
} from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import {
  getDefaultColumnCheckedStates,
  getDefaultTableCheckedStates,
  useApplyPrivilegeOperations,
  usePrivilegesState,
} from 'components/interfaces/Database/Privileges/Privileges.utils'
import PrivilegesHead from 'components/interfaces/Database/Privileges/PrivilegesHead'
import PrivilegesTable from 'components/interfaces/Database/Privileges/PrivilegesTable'
import { ProtectedSchemaWarning } from 'components/interfaces/Database/ProtectedSchemaWarning'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { DocsButton } from 'components/ui/DocsButton'
import { PgRole, useDatabaseRolesQuery } from 'data/database-roles/database-roles-query'
import { useColumnPrivilegesQuery } from 'data/privileges/column-privileges-query'
import { useTablePrivilegesQuery } from 'data/privileges/table-privileges-query'
import { useTablesQuery } from 'data/tables/tables-query'
import { useLocalStorage } from 'hooks/misc/useLocalStorage'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useIsProtectedSchema } from 'hooks/useProtectedSchemas'
import { DOCS_URL } from 'lib/constants'
import { AlertCircle, XIcon } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { NextPageWithLayout } from 'types'
import { Alert_Shadcn_, AlertDescription_Shadcn_, AlertTitle_Shadcn_, Button } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

const EDITABLE_ROLES = ['authenticated', 'anon', 'service_role']

const PrivilegesPage: NextPageWithLayout = () => {
  const { ref, table: paramTable } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { toggleFeaturePreviewModal } = useFeaturePreviewModal()
  const isEnabled = useIsColumnLevelPrivilegesEnabled()

  const { selectedSchema, setSelectedSchema } = useQuerySchemaState()
  const [selectedTable, setSelectedTable] = useState<string | undefined>(paramTable)
  const [selectedRole, setSelectedRole] = useState<string>('authenticated')

  const {
    data: tableList,
    isPending: isLoadingTables,
    isSuccess: isSuccessTables,
  } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  useEffect(() => {
    if (!isSuccessTables) return
    const tables = tableList
      .filter((table) => table.schema === selectedSchema)
      .map((table) => table.name)
    if (tables[0] && selectedTable === undefined) {
      setSelectedTable(tables[0])
    }
  }, [isSuccessTables, tableList, selectedSchema, selectedTable])

  const { data: allRoles, isPending: isLoadingRoles } = useDatabaseRolesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const tables = tableList
    ?.filter((table) => table.schema === selectedSchema)
    .map((table) => table.name)

  const {
    data: allTablePrivileges,
    isPending: isLoadingTablePrivileges,
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
    isPending: isLoadingColumnPrivileges,
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

  const rolesList = allRoles?.filter((role: PgRole) => EDITABLE_ROLES.includes(role.name)) ?? []
  const roles = rolesList.map((role: PgRole) => role.name)

  const table = tableList?.find(
    (table) => table.schema === selectedSchema && table.name === selectedTable
  )
  const { isSchemaLocked } = useIsProtectedSchema({ schema: selectedSchema })

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
        toast.success(
          `Successfully updated privileges on ${selectedSchema}.${selectedTable} for ${selectedRole}`,
          { duration: 6000 }
        )
        resetOperations()
      }, [resetOperations, selectedRole, selectedSchema, selectedTable])
    )

  function applyChanges() {
    applyColumnPrivileges(operations)
  }

  const [diffWarningDismissed, setDiffWarningDismissed] = useLocalStorage(
    LOCAL_STORAGE_KEYS.CLS_DIFF_WARNING,
    false
  )
  const [selectStarWarningDismissed, setSelectStarWarningDismissed] = useLocalStorage(
    LOCAL_STORAGE_KEYS.CLS_SELECT_STAR_WARNING,
    false
  )

  const isLoading =
    isLoadingTablePrivileges || isLoadingColumnPrivileges || isLoadingTables || isLoadingRoles

  const isError = isErrorTablePrivileges || isErrorColumnPrivileges

  return (
    <ScaffoldContainer className="h-full">
      <ScaffoldSection className="h-full">
        <div className="col-span-12 flex flex-col pb-4 gap-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="mb-1 text-xl">Column-level privileges</h3>
              <div className="text-sm text-lighter">
                <p>Grant or revoke privileges on a column based on user role.</p>
              </div>
            </div>
            <DocsButton href={`${DOCS_URL}/guides/auth/column-level-security`} />
          </div>

          {isEnabled ? (
            <>
              {!diffWarningDismissed && (
                <Alert_Shadcn_ variant="warning">
                  <AlertCircle strokeWidth={2} />
                  <AlertTitle_Shadcn_>
                    Changes to column privileges will not be reflected in migrations when running{' '}
                    <code className="text-code-inline">supabase db diff</code>.
                  </AlertTitle_Shadcn_>
                  <AlertDescription_Shadcn_>
                    Column privileges are not supported in the current version of the Supabase CLI.
                    <br />
                    You will need to manually apply these changes to your database.
                  </AlertDescription_Shadcn_>
                  <Button
                    type="outline"
                    aria-label="Dismiss"
                    className="absolute top-2 right-2 p-1 !pl-1"
                    onClick={() => {
                      setDiffWarningDismissed(true)
                    }}
                  >
                    <XIcon width={14} height={14} />
                  </Button>
                </Alert_Shadcn_>
              )}

              {!selectStarWarningDismissed && (
                <Alert_Shadcn_ variant="warning">
                  <AlertCircle strokeWidth={2} />
                  <AlertTitle_Shadcn_>
                    Changing column privileges can break existing queries.
                  </AlertTitle_Shadcn_>
                  <AlertDescription_Shadcn_>
                    If you remove a column privilege for a role, that role will lose all access to
                    that column.
                    <br />
                    All operations selecting <code className="text-code-inline">
                      *
                    </code> (including <code className="text-code-inline">returning *</code> for{' '}
                    <code className="text-code-inline">insert</code>,{' '}
                    <code className="text-code-inline">update</code>, and{' '}
                    <code className="text-code-inline">delete</code>) will fail.
                  </AlertDescription_Shadcn_>
                  <Button
                    type="outline"
                    aria-label="Dismiss"
                    className="absolute top-2 right-2 p-1 !pl-1"
                    onClick={() => {
                      setSelectStarWarningDismissed(true)
                    }}
                  >
                    <XIcon width={14} height={14} />
                  </Button>
                </Alert_Shadcn_>
              )}

              <PrivilegesHead
                disabled={isSchemaLocked}
                selectedSchema={selectedSchema}
                selectedRole={selectedRole}
                selectedTable={table}
                tables={tables ?? []}
                roles={roles}
                onChangeSchema={handleChangeSchema}
                onChangeRole={handleChangeRole}
                onChangeTable={handleChangeTable}
                applyChanges={applyChanges}
                resetChanges={resetOperations}
                hasChanges={hasChanges}
                isApplyingChanges={isApplyingChanges}
              />
              {isSchemaLocked && (
                <ProtectedSchemaWarning schema={selectedSchema} entity="column privileges" />
              )}
              {isLoading ? (
                <GenericSkeletonLoader />
              ) : isError ? (
                <AlertError error={errorTablePrivileges || errorColumnPrivileges} />
              ) : table && tablePrivilege ? (
                <div>
                  <PrivilegesTable
                    disabled={isSchemaLocked}
                    columnPrivileges={columnPrivileges}
                    tableCheckedStates={tableCheckedStates}
                    columnCheckedStates={columnCheckedStates}
                    toggleTablePrivilege={toggleTablePrivilege}
                    toggleColumnPrivilege={toggleColumnPrivilege}
                    isApplyingChanges={isApplyingChanges}
                  />
                </div>
              ) : (tables ?? []).length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center w-[600px] mx-auto">
                  <p className="text-center">There are no tables in the {selectedSchema} schema</p>
                  <p className="text-sm text-foreground-light text-center">
                    Once a table is available in the schema, you may manage it's column-level
                    privileges here
                  </p>
                  {selectedSchema === 'public' && (
                    <Button asChild className="mt-4">
                      <Link href={`/project/${ref}/editor`}>Create a new table</Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 ">
                  <p className="text-foreground-light">Select a table to edit privileges</p>
                </div>
              )}
            </>
          ) : (
            <Alert_Shadcn_>
              <AlertTitle_Shadcn_>
                Column-level privileges is a dashboard feature preview
              </AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_>
                You may access this feature by enabling it under dashboard feature previews.
              </AlertDescription_Shadcn_>
              <div className="mt-4">
                <Button type="default" onClick={() => toggleFeaturePreviewModal(true)}>
                  View feature previews
                </Button>
              </div>
            </Alert_Shadcn_>
          )}
        </div>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

PrivilegesPage.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Column Privileges">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default PrivilegesPage
