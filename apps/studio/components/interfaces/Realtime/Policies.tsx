import { PostgresPolicy } from '@supabase/postgres-meta'
import { useMemo, useState } from 'react'

import { Policies } from 'components/interfaces/Auth/Policies/Policies'
import { PolicyEditorPanel } from 'components/interfaces/Auth/Policies/PolicyEditorPanel'
import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useDatabasePoliciesQuery } from 'data/database-policies/database-policies-query'
import { useTablesQuery } from 'data/tables/tables-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'

export const RealtimePolicies = () => {
  const { data: project } = useSelectedProjectQuery()

  const [showPolicyEditor, setShowPolicyEditor] = useState(false)
  const [selectedPolicyToEdit, setSelectedPolicyToEdit] = useState<PostgresPolicy>()

  const {
    data: tables,
    isLoading,
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
    isLoading: isLoadingPolicies,
    isError: isPoliciesError,
    error: policiesError,
  } = useDatabasePoliciesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  return (
    <>
      {isLoading && <GenericSkeletonLoader />}

      {isError && <AlertError error={error} subject="Failed to retrieve tables" />}

      {isSuccess && (
        <Policies
          schema="realtime"
          tables={filteredTables}
          hasTables
          isLocked={false}
          policies={policies ?? []}
          isLoadingPolicies={isLoadingPolicies}
          isPoliciesError={isPoliciesError}
          policiesError={policiesError}
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
