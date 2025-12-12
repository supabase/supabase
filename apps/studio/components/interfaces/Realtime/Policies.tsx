import { PostgresPolicy } from '@supabase/postgres-meta'
import { useMemo, useState } from 'react'

import { Policies } from 'components/interfaces/Auth/Policies/Policies'
import { PoliciesDataProvider } from 'components/interfaces/Auth/Policies/PoliciesDataContext'
import { PolicyEditorPanel } from 'components/interfaces/Auth/Policies/PolicyEditorPanel'
import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useProjectPostgrestConfigQuery } from 'data/config/project-postgrest-config-query'
import { useDatabasePoliciesQuery } from 'data/database-policies/database-policies-query'
import { useTablesQuery } from 'data/tables/tables-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'

export const RealtimePolicies = () => {
  const { data: project } = useSelectedProjectQuery()
  const { data: postgrestConfig } = useProjectPostgrestConfigQuery({ projectRef: project?.ref })

  const [showPolicyEditor, setShowPolicyEditor] = useState(false)
  const [selectedPolicyToEdit, setSelectedPolicyToEdit] = useState<PostgresPolicy>()

  const {
    data: tables,
    isPending: isLoading,
    isSuccess,
    isError,
    error,
  } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: 'realtime',
  })

  const filteredTables = useMemo(
    () => (tables ?? []).filter((table) => table.name === 'messages'),
    [tables]
  )
  const visibleTableIds = useMemo(
    () => new Set(filteredTables.map((table) => table.id)),
    [filteredTables]
  )
  const {
    data: policies,
    isPending: isLoadingPolicies,
    isError: isPoliciesError,
    error: policiesError,
  } = useDatabasePoliciesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const exposedSchemas = useMemo(() => {
    const dbSchema = postgrestConfig?.db_schema
    if (!dbSchema) return []

    return dbSchema
      .split(',')
      .map((schema) => schema.trim())
      .filter((schema) => schema.length > 0)
  }, [postgrestConfig?.db_schema])

  return (
    <>
      {isLoading && <GenericSkeletonLoader />}

      {isError && <AlertError error={error} subject="Failed to retrieve tables" />}

      {isSuccess && (
        <PoliciesDataProvider
          policies={policies ?? []}
          isPoliciesLoading={isLoadingPolicies}
          isPoliciesError={isPoliciesError}
          policiesError={policiesError ?? undefined}
          exposedSchemas={exposedSchemas}
        >
          <Policies
            schema="realtime"
            tables={filteredTables}
            hasTables
            isLocked={false}
            visibleTableIds={visibleTableIds}
            onSelectCreatePolicy={(_tableName) => {
              setSelectedPolicyToEdit(undefined)
              setShowPolicyEditor(true)
            }}
            onSelectEditPolicy={(policy) => {
              setSelectedPolicyToEdit(policy)
              setShowPolicyEditor(true)
            }}
          />
        </PoliciesDataProvider>
      )}

      <PolicyEditorPanel
        visible={showPolicyEditor}
        searchString="messages"
        schema="realtime"
        selectedPolicy={selectedPolicyToEdit}
        onSelectCancel={() => setShowPolicyEditor(false)}
        authContext="realtime"
      />
    </>
  )
}
