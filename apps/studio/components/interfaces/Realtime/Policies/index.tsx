import { PostgresPolicy } from '@supabase/postgres-meta'
import { useParams } from 'common'
import { Loader } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { AIPolicyEditorPanel } from 'components/interfaces/Auth/Policies/AIPolicyEditorPanel'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useDatabasePoliciesQuery } from 'data/database-policies/database-policies-query'
import { useDatabasePolicyDeleteMutation } from 'data/database-policies/database-policy-delete-mutation'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import ConfirmModal from 'ui-patterns/Dialogs/ConfirmDialog'
import { PolicyRow } from './RealtimePoliciesChannelRow'
import { RealtimePoliciesPlaceholder } from './RealtimePoliciesPlaceholder'

export const RealtimePolicies = () => {
  const { project } = useProjectContext()
  const { ref: projectRef } = useParams()
  const state = useTableEditorStateSnapshot()
  useEffect(() => {
    state.setSelectedSchemaName('realtime')
  }, [])

  const [channelDataForPolicy, setChannelDataForPolicy] = useState<{
    table: string
    templateData: Record<string, string>
  } | null>()
  const [policyEditorShown, showPolicyEditor] = useState(false)
  const [selectedPolicyToEdit, setSelectedPolicyToEdit] = useState<PostgresPolicy | undefined>(
    undefined
  )
  const [selectedPolicyToDelete, setSelectedPolicyToDelete] = useState<PostgresPolicy | undefined>(
    undefined
  )

  const { data: policiesData, isLoading: isLoadingPolicies } = useDatabasePoliciesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: 'realtime',
  })
  const realtimePolicies = policiesData ?? []

  const isLoading = isLoadingPolicies

  const { mutate: deleteDatabasePolicy } = useDatabasePolicyDeleteMutation({
    onSuccess: async () => {
      toast.success('Successfully deleted policy!')
      setSelectedPolicyToDelete(undefined)
    },
  })

  const onDeletePolicy = async () => {
    if (!project) return console.error('Project is required')
    if (!selectedPolicyToDelete) return console.error('Policy is required')
    deleteDatabasePolicy({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      id: selectedPolicyToDelete.id,
    })
  }

  // const groupedPolicies = formatPoliciesForRealtime(channels, realtimePolicies)
  // const ungroupedPolicies = groupedPolicies.find((gr) => gr.name === 'Ungrouped')

  return (
    <div className="flex min-h-full w-full flex-col p-4">
      <h3 className="text-xl">Realtime policies</h3>
      <p className="mt-2 text-sm text-foreground-light">
        Safeguard your channels with policies that define the operations allowed for your users at
        the channel level.
      </p>

      {isLoading ? (
        <div className="flex h-full items-center justify-center">
          <Loader className="animate-spin" size={16} />
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <RealtimePoliciesPlaceholder />

          <p className="text-sm text-foreground-light">
            You may also write general policies for the <code>channels</code> table under the
            realtime schema directly for greater control
          </p>
          {realtimePolicies.map((policy) => {
            return (
              <PolicyRow
                key={policy.id}
                policy={policy}
                onSelectPolicyEdit={() => {
                  setSelectedPolicyToEdit(policy)
                  setChannelDataForPolicy({
                    table: policy.table,
                    templateData: {},
                  })
                  showPolicyEditor(true)
                }}
                onSelectPolicyDelete={(policy) => setSelectedPolicyToDelete(policy)}
              />
            )
          })}
        </div>
      )}

      <AIPolicyEditorPanel
        visible={policyEditorShown}
        searchString={channelDataForPolicy?.table}
        templateData={channelDataForPolicy?.templateData}
        schema="realtime"
        selectedPolicy={selectedPolicyToEdit}
        onSelectCancel={() => {
          showPolicyEditor(false)
        }}
      />

      <ConfirmModal
        danger
        visible={!!selectedPolicyToDelete}
        title="Confirm to delete policy"
        description={`This is permanent! Are you sure you want to delete the policy "${selectedPolicyToDelete?.name}"`}
        buttonLabel="Delete"
        buttonLoadingLabel="Deleting"
        onSelectCancel={() => setSelectedPolicyToDelete(undefined)}
        onSelectConfirm={onDeletePolicy}
      />
    </div>
  )
}
