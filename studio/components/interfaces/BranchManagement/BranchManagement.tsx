import { isError, partition } from 'lodash'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  IconAlertTriangle,
  IconGitBranch,
  IconSearch,
  Input,
  Modal,
} from 'ui'

import { useParams } from 'common'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import AlertError from 'components/ui/AlertError'
import ConfirmationModal from 'components/ui/ConfirmationModal'
import TextConfirmModal from 'components/ui/Modals/TextConfirmModal'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useBranchDeleteMutation } from 'data/branches/branch-delete-mutation'
import { useBranchesDisableMutation } from 'data/branches/branches-disable-mutation'
import { Branch, useBranchesQuery } from 'data/branches/branches-query'
import { useOrgIntegrationsQuery } from 'data/integrations/integrations-query-org-only'
import { useSelectedOrganization, useSelectedProject, useStore } from 'hooks'
import { useAppUiStateSnapshot } from 'state/app'
import { MainBranchPanel } from './BranchPanels'
import CreateBranchSidePanel from './CreateBranchSidePanel'
import PreviewBranches from './PreviewBranches'
import PullRequests from './PullRequests'

const BranchManagement = () => {
  const { ui } = useStore()
  const router = useRouter()
  const { ref } = useParams()
  const projectDetails = useSelectedProject()
  const selectedOrg = useSelectedOrganization()

  const hasAccessToBranching =
    selectedOrg?.opt_in_tags?.includes('PREVIEW_BRANCHES_OPT_IN') ?? false

  const isBranch = projectDetails?.parent_project_ref !== undefined
  const hasBranchEnabled = projectDetails?.is_branch_enabled
  const projectRef =
    projectDetails !== undefined ? (isBranch ? projectDetails.parent_project_ref : ref) : undefined

  const snap = useAppUiStateSnapshot()
  const [showCreateBranch, setShowCreateBranch] = useState(false)
  const [showDisableBranching, setShowDisableBranching] = useState(false)
  const [selectedBranchToDelete, setSelectedBranchToDelete] = useState<Branch>()

  const {
    data: integrations,
    error: integrationsError,
    isLoading: isLoadingIntegrations,
    isError: isErrorIntegrations,
    isSuccess: isSuccessIntegrations,
  } = useOrgIntegrationsQuery({ orgSlug: selectedOrg?.slug })

  const githubConnections = integrations
    ?.filter((integration) => integration.integration.name === 'GitHub')
    .flatMap((integration) => integration.connections)
  const githubConnection = githubConnections?.find(
    (connection) => connection.supabase_project_ref === ref
  )

  const { data: branches } = useBranchesQuery({ projectRef })
  const [[mainBranch], previewBranches] = partition(branches, (branch) => branch.is_default)

  const { mutate: deleteBranch, isLoading: isDeleting } = useBranchDeleteMutation({
    onSuccess: () => {
      if (selectedBranchToDelete?.project_ref === ref) {
        ui.setNotification({
          category: 'success',
          message:
            'Successfully deleted branch. You are now currently on the main branch of your project.',
        })
        router.push(`/project/${projectRef}/branches`)
      } else {
        ui.setNotification({ category: 'success', message: 'Successfully deleted branch' })
      }
      setSelectedBranchToDelete(undefined)
    },
  })

  const { mutate: disableBranching, isLoading: isDisabling } = useBranchesDisableMutation({
    onSuccess: () => {
      ui.setNotification({
        category: 'success',
        message: 'Successfully disabled branching for project',
      })
      setShowDisableBranching(false)
    },
  })

  const generateCreatePullRequestURL = (branch?: string) => {
    if (githubConnection === undefined) return 'https://github.com'

    return branch !== undefined
      ? `https://github.com/${githubConnection.metadata.name}/compare/${mainBranch?.git_branch}...${branch}`
      : `https://github.com/${githubConnection.metadata.name}/compare`
  }

  const onConfirmDeleteBranch = () => {
    if (selectedBranchToDelete == undefined) return console.error('No branch selected')
    if (projectRef == undefined) return console.error('Project ref is required')
    deleteBranch({ id: selectedBranchToDelete?.id, projectRef })
  }

  const onConfirmDisableBranching = () => {
    if (projectRef == undefined) return console.error('Project ref is required')
    if (!previewBranches) return console.error('No branches available')
    disableBranching({ projectRef, branchIds: previewBranches?.map((branch) => branch.id) })
  }

  if (!hasBranchEnabled) {
    // [Joshen] Some empty state here
    return (
      <ProductEmptyState title="Database Branching">
        <p className="text-sm text-light">
          {hasAccessToBranching
            ? 'Create preview branches to experiment changes to your database schema in a safe, non-destructible environment.'
            : "Register for early access and you'll be contacted by email when your organization is enrolled in database branching."}
        </p>
        {hasAccessToBranching ? (
          <div className="!mt-4">
            <Button
              icon={<IconGitBranch strokeWidth={1.5} />}
              onClick={() => snap.setShowEnableBranchingModal(true)}
            >
              Enable branching
            </Button>
          </div>
        ) : (
          <div className="flex items-center space-x-2 !mt-4">
            <Link passHref href={'/'}>
              <a rel="noreferrer" target="_blank">
                <Button>Join waitlist</Button>
              </a>
            </Link>
            <Link passHref href={'/'}>
              <a rel="noreferrer" target="_blank">
                <Button type="default">View the docs</Button>
              </a>
            </Link>
          </div>
        )}
      </ProductEmptyState>
    )
  }

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldSection>
          <div className="col-span-12">
            <h3 className="text-xl mb-8">Branch Manager</h3>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Input placeholder="Search branch" size="small" icon={<IconSearch />} />
              </div>
              <Button onClick={() => setShowCreateBranch(true)}>Create preview branch</Button>
            </div>
            <div className="">
              {isLoadingIntegrations && <GenericSkeletonLoader />}
              {isErrorIntegrations && (
                <AlertError
                  error={integrationsError}
                  subject="Failed to retrieve GitHub integration connection"
                />
              )}
              {isSuccessIntegrations && (
                <>
                  <MainBranchPanel
                    repo={githubConnection?.metadata.name}
                    branch={mainBranch}
                    onSelectDisableBranching={() => setShowDisableBranching(true)}
                  />
                  <PullRequests
                    previewBranches={previewBranches}
                    generateCreatePullRequestURL={generateCreatePullRequestURL}
                    onSelectDeleteBranch={setSelectedBranchToDelete}
                  />
                  <PreviewBranches
                    generateCreatePullRequestURL={generateCreatePullRequestURL}
                    onSelectCreateBranch={() => setShowCreateBranch(true)}
                    onSelectDeleteBranch={setSelectedBranchToDelete}
                  />
                </>
              )}
            </div>
          </div>
        </ScaffoldSection>
      </ScaffoldContainer>

      <TextConfirmModal
        size="medium"
        visible={selectedBranchToDelete !== undefined}
        onCancel={() => setSelectedBranchToDelete(undefined)}
        onConfirm={() => onConfirmDeleteBranch()}
        loading={isDeleting}
        title="Delete branch"
        confirmLabel="Delete branch"
        confirmPlaceholder="Type in name of branch"
        confirmString={selectedBranchToDelete?.name ?? ''}
        text={`This will delete your database preview branch "${selectedBranchToDelete?.name}"`}
        alert="You cannot recover this branch once it is deleted!"
      />

      <ConfirmationModal
        danger
        size="medium"
        loading={isDisabling}
        visible={showDisableBranching}
        header="Confirm disable branching for project"
        buttonLabel="Confirm disable branching"
        buttonLoadingLabel="Disabling branching..."
        onSelectConfirm={() => onConfirmDisableBranching()}
        onSelectCancel={() => setShowDisableBranching(false)}
      >
        <Modal.Content>
          <div className="py-6">
            <Alert_Shadcn_ variant="warning">
              <IconAlertTriangle strokeWidth={2} />
              <AlertTitle_Shadcn_>This action cannot be undone</AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_>
                All database preview branches will be removed upon disabling branching. You may
                still re-enable branching again thereafter, but your existing preview branches will
                not be restored.
              </AlertDescription_Shadcn_>
            </Alert_Shadcn_>
            <ul className="mt-4 space-y-5">
              <li className="flex gap-3">
                <div>
                  <strong className="text-sm">Before you disable branching, consider:</strong>
                  <ul className="space-y-2 mt-2 text-sm text-light">
                    <li className="list-disc ml-6">
                      Your project no longer requires database previews.
                    </li>
                    <li className="list-disc ml-6">
                      None of your database previews are currently being used in any app.
                    </li>
                  </ul>
                </div>
              </li>
            </ul>
          </div>
        </Modal.Content>
      </ConfirmationModal>

      <CreateBranchSidePanel
        visible={showCreateBranch}
        onClose={() => setShowCreateBranch(false)}
      />
    </>
  )
}

export default BranchManagement
