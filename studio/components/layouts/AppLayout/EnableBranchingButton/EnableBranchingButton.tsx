import { useParams } from 'common'
import { useEffect, useState } from 'react'
import { Button, IconFileText, IconGitBranch, Modal } from 'ui'

import SidePanelGitHubRepoLinker from 'components/interfaces/Organization/IntegrationSettings/SidePanelGitHubRepoLinker'
import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useBranchCreateMutation } from 'data/branches/branch-create-mutation'
import { useOrgIntegrationsQuery } from 'data/integrations/integrations-query-org-only'
import { IntegrationName } from 'data/integrations/integrations.types'
import { useSelectedOrganization, useStore } from 'hooks'
import { useAppUiStateSnapshot } from 'state/app'
import BranchingWaitlistPopover from './BranchingWaitlistPopover'
import GithubRepositorySelection from './GithubRepositorySelection'
import VercelProjectSelection from './VercelProjectSelection'

const EnableBranchingButton = () => {
  const { ui } = useStore()
  const { ref } = useParams()
  const selectedOrg = useSelectedOrganization()

  const snap = useAppUiStateSnapshot()
  const [selectedBranch, setSelectedBranch] = useState<string>()
  const [addConnectionType, setAddConnectionType] = useState<IntegrationName>()

  useEffect(() => {
    if (snap.showEnableBranchingModal) setSelectedBranch(undefined)
  }, [snap.showEnableBranchingModal])

  const {
    data: integrations,
    error: integrationsError,
    isLoading: isLoadingIntegrations,
    isSuccess: isSuccessIntegrations,
    isError: isErrorIntegrations,
  } = useOrgIntegrationsQuery({
    orgSlug: selectedOrg?.slug,
  })

  const { mutate: createBranch, isLoading: isCreating } = useBranchCreateMutation({
    onSuccess: () => {
      ui.setNotification({ category: 'success', message: `Successfully created new branch` })
      snap.setShowEnableBranchingModal(false)
    },
  })

  const hasAccessToBranching =
    selectedOrg?.opt_in_tags?.includes('PREVIEW_BRANCHES_OPT_IN') ?? false

  const hasGithubIntegrationInstalled =
    integrations?.some((integration) => integration.integration.name === 'GitHub') ?? false
  const githubIntegration = integrations?.find(
    (integration) =>
      integration.integration.name === 'GitHub' &&
      integration.connections.some((connection) => connection.supabase_project_ref === ref)
  )

  // [Joshen] Leaving this out first
  // const hasVercelIntegrationInstalled =
  //   integrations?.some((integration) => integration.integration.name === 'Vercel') ?? false
  // const vercelIntegration = integrations?.find(
  //   (integration) =>
  //     integration.integration.name === 'Vercel' &&
  //     integration.connections.some((connection) => connection.supabase_project_ref === ref)
  // )

  const onEnableBranching = () => {
    if (!ref) return console.error('Project ref is required')
    if (!selectedBranch) return console.error('No branch selected')
    createBranch({ projectRef: ref, branchName: selectedBranch, gitBranch: selectedBranch })
  }

  if (!hasAccessToBranching) {
    return <BranchingWaitlistPopover />
  }

  return (
    <>
      <Button
        icon={<IconGitBranch strokeWidth={1.5} />}
        type="default"
        onClick={() => snap.setShowEnableBranchingModal(true)}
      >
        Enable branching
      </Button>
      <Modal
        hideFooter
        visible={snap.showEnableBranchingModal}
        onCancel={() => snap.setShowEnableBranchingModal(false)}
        className="!bg"
        size="medium"
      >
        <Modal.Content className="px-7 py-5 flex items-center space-x-4">
          <IconGitBranch strokeWidth={2} size={20} />
          <div>
            <p className="text">Enable database branching</p>
            <p className="text-sm text-light">Management environments in Supabase</p>
          </div>
        </Modal.Content>

        {isLoadingIntegrations && (
          <>
            <Modal.Separator />
            <Modal.Content className="px-7 py-6">
              <GenericSkeletonLoader />
            </Modal.Content>
            <Modal.Separator />
          </>
        )}

        {isErrorIntegrations && (
          <>
            <Modal.Separator />
            <Modal.Content className="px-7 py-6">
              <AlertError error={integrationsError} subject="Failed to retrieve integrations" />
            </Modal.Content>
            <Modal.Separator />
          </>
        )}

        {isSuccessIntegrations && (
          <>
            <GithubRepositorySelection
              integration={githubIntegration}
              selectedBranch={selectedBranch}
              hasGithubIntegrationInstalled={hasGithubIntegrationInstalled}
              setSelectedBranch={setSelectedBranch}
              onSelectConnectRepo={() => setAddConnectionType('GitHub')}
            />

            {/* <VercelProjectSelection integration={vercelIntegration} /> */}

            {/* <Modal.Separator /> */}
          </>
        )}

        {/* [Joshen TODO] Feels like this copy writing needs some relooking before we ship, make sure they are factual too */}
        <Modal.Content className="px-7 py-6 flex flex-col gap-3">
          <p className="text-sm text-light">Please keep in mind the following:</p>
          <div className="flex flex-row gap-4">
            <div>
              <figure className="w-10 h-10 rounded-md bg-warning-200 border border-warning-300 flex items-center justify-center">
                <IconFileText className="text-amber-900" size={20} strokeWidth={2} />
              </figure>
            </div>
            <div>
              <p className="text-sm text">
                You will not be able to use the dashboard to make changes to the database
              </p>
              <p className="text-sm text-light">
                Schema changes for database preview branches must be done via Git. We are
                nonetheless working on allowing the dashboard to make schema changes for preview
                branches.
              </p>
            </div>
          </div>
        </Modal.Content>

        <Modal.Separator />

        <Modal.Content className="px-7">
          <div className="flex items-center space-x-2 py-2 pb-4">
            <Button
              size="medium"
              block
              disabled={isCreating}
              type="default"
              onClick={() => snap.setShowEnableBranchingModal(false)}
            >
              Cancel
            </Button>
            <Button
              size="medium"
              block
              disabled={selectedBranch === undefined || isCreating}
              loading={isCreating}
              type="primary"
              onClick={() => onEnableBranching()}
            >
              I understand, enable branching
            </Button>
          </div>
        </Modal.Content>
      </Modal>

      <SidePanelGitHubRepoLinker
        isOpen={addConnectionType === 'GitHub'}
        projectRef={ref}
        organizationIntegrationId={githubIntegration?.id}
        onClose={() => setAddConnectionType(undefined)}
      />
    </>
  )
}

export default EnableBranchingButton
