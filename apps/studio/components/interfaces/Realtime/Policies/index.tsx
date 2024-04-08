import { PostgresPolicy } from '@supabase/postgres-meta'
import { useParams } from 'common'
import { Loader } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { AIPolicyEditorPanel } from 'components/interfaces/Auth/Policies/AIPolicyEditorPanel'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useDatabasePoliciesQuery } from 'data/database-policies/database-policies-query'
import { useDatabasePolicyDeleteMutation } from 'data/database-policies/database-policy-delete-mutation'
import { useChannelsQuery } from 'data/realtime/channels-query'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { Separator } from 'ui'
import ConfirmModal from 'ui-patterns/Dialogs/ConfirmDialog'
import { formatPoliciesForRealtime } from './RealtimePolicies.utils'
import { PolicyRow, RealtimePoliciesChannelRow } from './RealtimePoliciesChannelRow'
import { RealtimePoliciesPlaceholder } from './RealtimePoliciesPlaceholder'
import { useProjectConnectionData } from './useProjectConnectionData'

export const RealtimePolicies = () => {
  const { project } = useProjectContext()
  const { ref: projectRef } = useParams()
  const state = useTableEditorStateSnapshot()
  useEffect(() => {
    state.setSelectedSchemaName('realtime')
  }, [])

  const { endpoint, accessToken, isReady } = useProjectConnectionData(projectRef!)
  const { data, isLoading: isLoadingChannels } = useChannelsQuery(
    {
      projectRef: projectRef!,
      endpoint: endpoint,
      accessToken: accessToken!,
    },
    { enabled: isReady }
  )
  const channels = data || []

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

  const isLoading = isLoadingChannels || isLoadingPolicies

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

  const groupedPolicies = formatPoliciesForRealtime(channels, realtimePolicies)
  const ungroupedPolicies = groupedPolicies.find((gr) => gr.name === 'Ungrouped')

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
          {channels.length === 0 && <RealtimePoliciesPlaceholder />}

          {/* Sections for policies grouped by buckets */}
          {channels.map((channel) => {
            const found = groupedPolicies.find((gr) => gr.name === channel.name) || { policies: [] }
            const policies = [...found?.policies].sort((a, b) => a.name.localeCompare(b.name))

            return (
              <RealtimePoliciesChannelRow
                key={channel.name}
                channel={channel}
                policies={policies}
                onSelectPolicyAdd={(table) => {
                  setSelectedPolicyToEdit(undefined)
                  setChannelDataForPolicy({
                    table: table,
                    templateData: {
                      channelId: `${channel.id}`,
                    },
                  })
                  showPolicyEditor(true)
                }}
                onSelectPolicyEdit={(policy) => {
                  setSelectedPolicyToEdit(policy)
                  setChannelDataForPolicy({
                    table: policy.table,
                    templateData: {
                      channelId: `${channel.id}`,
                    },
                  })
                  showPolicyEditor(true)
                }}
                onSelectPolicyDelete={(policy) => setSelectedPolicyToDelete(policy)}
              />
            )
          })}

          <Separator />
          <p className="text-sm text-foreground-light">
            You may also write policies for the tables under the storage schema directly for greater
            control
          </p>
          {ungroupedPolicies?.policies.map((policy) => {
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
