import { PostgresPolicy } from '@supabase/postgres-meta'
import { useState } from 'react'

import { Policies } from 'components/interfaces/Auth/Policies'
import { AIPolicyEditorPanel } from 'components/interfaces/Auth/Policies/AIPolicyEditorPanel'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useTablesQuery } from 'data/tables/tables-query'

export const RealtimePolicies = () => {
  const { project } = useProjectContext()

  const [policyEditorShown, showPolicyEditor] = useState(false)
  const [selectedPolicyToEdit, setSelectedPolicyToEdit] = useState<PostgresPolicy | undefined>(
    undefined
  )

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
    <div className="flex min-h-full w-full flex-col p-4">
      <h3 className="text-xl">Realtime policies</h3>
      <p className="mt-2 text-sm text-foreground-light">
        You can use RLS policies to control access to Realtime Channels.
      </p>

      {isLoading && <GenericSkeletonLoader />}

      {isError && <AlertError error={error} subject="Failed to retrieve tables" />}

      {isSuccess && (
        <div className="mt-4 space-y-4">
          <Policies
            schema="realtime"
            tables={filteredTables}
            hasTables
            isLocked={false}
            onSelectCreatePolicy={() => {
              setSelectedPolicyToEdit(undefined)
              showPolicyEditor(true)
            }}
            onSelectEditPolicy={(policy) => {
              setSelectedPolicyToEdit(policy)
              showPolicyEditor(true)
            }}
          />
        </div>
      )}

      <AIPolicyEditorPanel
        visible={policyEditorShown}
        searchString="messages"
        schema="realtime"
        selectedPolicy={selectedPolicyToEdit}
        onSelectCancel={() => showPolicyEditor(false)}
      />
    </div>
  )
}
