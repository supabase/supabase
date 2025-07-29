import { PostgresPolicy } from '@supabase/postgres-meta'
import { useState } from 'react'

import { PolicyEditorPanel } from 'components/interfaces/Auth/Policies/PolicyEditorPanel'
import Policies from 'components/interfaces/Auth/Policies/Policies'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlertError from 'components/ui/AlertError'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useTablesQuery } from 'data/tables/tables-query'

export const RealtimePolicies = () => {
  const { project } = useProjectContext()

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
    <div className="flex min-h-full w-full flex-col p-4 gap-y-4">
      <FormHeader
        className="!mb-0"
        title="Realtime policies"
        description="You can use RLS policies to control access to Realtime Channels"
      />

      {isLoading && <GenericSkeletonLoader />}

      {isError && <AlertError error={error} subject="Failed to retrieve tables" />}

      {isSuccess && (
        <div className="space-y-4">
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
        </div>
      )}

      <PolicyEditorPanel
        visible={showPolicyEditor}
        searchString="messages"
        schema="realtime"
        selectedPolicy={selectedPolicyToEdit}
        onSelectCancel={() => setShowPolicyEditor(false)}
        authContext="realtime"
      />
    </div>
  )
}
