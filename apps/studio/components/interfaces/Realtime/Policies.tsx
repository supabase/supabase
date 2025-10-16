import { PostgresPolicy } from '@supabase/postgres-meta'
import { useState } from 'react'

import { Policies } from 'components/interfaces/Auth/Policies/Policies'
import { PolicyEditorPanel } from 'components/interfaces/Auth/Policies/PolicyEditorPanel'
import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
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

  const filteredTables = (tables ?? []).filter((table) => table.name === 'messages')

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
          onSelectCreatePolicy={() => {
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
