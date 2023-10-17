import { useParams } from 'common'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  IconAlertCircle,
  IconFileText,
  IconGitBranch,
  Modal,
} from 'ui'

import SidePanelGitHubRepoLinker from 'components/interfaces/Organization/IntegrationSettings/SidePanelGitHubRepoLinker'
import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useBranchCreateMutation } from 'data/branches/branch-create-mutation'
import { useOrgIntegrationsQuery } from 'data/integrations/integrations-query-org-only'
import { useSelectedOrganization, useStore } from 'hooks'
import { useAppStateSnapshot } from 'state/app-state'
import GithubRepositorySelection from './GithubRepositorySelection'

const EnableBranchingModal = () => {
  const { ui } = useStore()
  const { ref } = useParams()
  const selectedOrg = useSelectedOrganization()

  const snap = useAppStateSnapshot()
  const [selectedBranch, setSelectedBranch] = useState<string>()

  const isOrgBilling = !!selectedOrg?.subscription_id

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

  const hasGithubIntegrationInstalled =
    integrations?.some((integration) => integration.integration.name === 'GitHub') ?? false
  const githubIntegration = integrations?.find(
    (integration) =>
      integration.integration.name === 'GitHub' &&
      integration.organization.slug === selectedOrg?.slug
  )

  const onEnableBranching = () => {
    if (!ref) return console.error('Project ref is required')
    if (!selectedBranch) return console.error('No branch selected')
    createBranch({ projectRef: ref, branchName: selectedBranch, gitBranch: selectedBranch })
  }

  return (
    <>
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
            <p className="text-foreground">Enable database branching</p>
            <p className="text-sm text-light">Manage environments in Supabase</p>
          </div>
        </Modal.Content>

        {!isOrgBilling ? (
          <>
            <Modal.Content className="px-3 border-y bg-alternative">
              <Alert_Shadcn_ variant="default" className="rounded-none border-0">
                <IconAlertCircle strokeWidth={2} />
                <AlertTitle_Shadcn_>
                  Organization-based billing migration required
                </AlertTitle_Shadcn_>
                <AlertDescription_Shadcn_>
                  <p className="!leading-normal">
                    Your organization will first need to be migrated to use our new
                    organization-based billing before you can enable Branching.
                  </p>
                  <p className="!leading-normal mt-1">
                    You may do so under the billing settings of your organization.
                  </p>
                </AlertDescription_Shadcn_>
              </Alert_Shadcn_>
            </Modal.Content>
            <Modal.Content className="px-4 pt-3">
              <div className="flex items-center justify-end space-x-2 py-2 pb-4">
                <Button
                  disabled={isCreating}
                  type="default"
                  onClick={() => snap.setShowEnableBranchingModal(false)}
                >
                  Understood
                </Button>
                <Link passHref href={`/org/${selectedOrg?.slug}/billing`}>
                  <Button asChild>
                    <a>Organization settings</a>
                  </Button>
                </Link>
              </div>
            </Modal.Content>
          </>
        ) : (
          <>
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
                />
              </>
            )}

            <Modal.Content className="px-7 py-6 flex flex-col gap-3">
              <p className="text-sm text-light">Please keep in mind the following:</p>
              <div className="flex flex-row gap-4">
                <div>
                  <figure className="w-10 h-10 rounded-md bg-warning-200 border border-warning-300 flex items-center justify-center">
                    <IconFileText className="text-amber-900" size={20} strokeWidth={2} />
                  </figure>
                </div>
                <div>
                  <p className="text-sm text-foreground">
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
          </>
        )}
      </Modal>

      <SidePanelGitHubRepoLinker projectRef={ref} />
    </>
  )
}

export default EnableBranchingModal
