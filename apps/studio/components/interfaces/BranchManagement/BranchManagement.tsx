import { PermissionAction } from '@supabase/shared-types/out/constants'
import { partition } from 'lodash'
import { GitMerge, MessageCircle } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { GitHubStatus } from 'components/interfaces/Settings/Integrations/GithubIntegration/GitHubStatus'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { DocsButton } from 'components/ui/DocsButton'
import NoPermission from 'components/ui/NoPermission'
import { useBranchDeleteMutation } from 'data/branches/branch-delete-mutation'
import { useBranchesDisableMutation } from 'data/branches/branches-disable-mutation'
import { useBranchUpdateMutation } from 'data/branches/branch-update-mutation'
import { Branch, useBranchesQuery } from 'data/branches/branches-query'
import { useGitHubConnectionsQuery } from 'data/integrations/github-connections-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useFlag } from 'hooks/ui/useFlag'
import { useUrlState } from 'hooks/ui/useUrlState'
import { useAppStateSnapshot } from 'state/app-state'
import { Button } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import TextConfirmModal from 'ui-patterns/Dialogs/TextConfirmModal'
import { BranchLoader, BranchManagementSection, BranchRow } from './BranchPanels'
import { BranchSelector } from './BranchSelector'
import { PreviewBranchesEmptyState, PullRequestsEmptyState } from './EmptyStates'
import { Overview } from './Overview'
import { ReviewRow } from './ReviewRow'

type Tab = 'overview' | 'prs' | 'branches'

const BranchManagement = () => {
  const router = useRouter()
  const { ref } = useParams()
  const project = useSelectedProject()
  const selectedOrg = useSelectedOrganization()
  const gitlessBranching = useFlag('gitlessBranching')

  const hasBranchEnabled = project?.is_branch_enabled

  const isBranch = project?.parent_project_ref !== undefined
  const projectRef =
    project !== undefined ? (isBranch ? project.parent_project_ref : ref) : undefined

  const [urlParams, setParams] = useUrlState<{ tab: Tab }>()
  const tab = urlParams.tab ?? 'overview'
  const setTab = (tab: Tab) => setParams({ tab })

  const snap = useAppStateSnapshot()

  const [showDisableBranching, setShowDisableBranching] = useState(false)
  const [selectedBranchToDelete, setSelectedBranchToDelete] = useState<Branch>()

  const canReadBranches = useCheckPermissions(PermissionAction.READ, 'preview_branches')
  const canCreateBranches = useCheckPermissions(PermissionAction.CREATE, 'preview_branches', {
    resource: { is_default: false },
  })

  const {
    data: connections,
    error: connectionsError,
    isLoading: isLoadingConnections,
    isSuccess: isSuccessConnections,
    isError: isErrorConnections,
  } = useGitHubConnectionsQuery({
    organizationId: selectedOrg?.id,
  })

  const {
    data: branches,
    error: branchesError,
    isLoading: isLoadingBranches,
    isError: isErrorBranches,
    isSuccess: isSuccessBranches,
  } = useBranchesQuery({ projectRef })
  const [[mainBranch], previewBranchesUnsorted] = partition(branches, (branch) => branch.is_default)
  const previewBranches = previewBranchesUnsorted.sort((a, b) =>
    new Date(a.updated_at) < new Date(b.updated_at) ? 1 : -1
  )
  const branchesWithPRs = previewBranches.filter((branch) => branch.pr_number !== undefined)
  const branchesReadyForReview = previewBranches.filter(
    (branch) => branch.review_requested_at !== undefined && branch.review_requested_at !== null
  )

  const currentBranch = branches?.find((branch) => branch.project_ref === ref)
  const isCurrentBranchReadyForReview =
    currentBranch?.review_requested_at !== undefined && currentBranch?.review_requested_at !== null

  const githubConnection = connections?.find((connection) => connection.project.ref === projectRef)
  const repo = githubConnection?.repository.name ?? ''

  const isError = isErrorConnections || isErrorBranches
  const isLoading = isLoadingConnections || isLoadingBranches
  const isSuccess = isSuccessConnections && isSuccessBranches

  const { mutate: deleteBranch, isLoading: isDeleting } = useBranchDeleteMutation({
    onSuccess: () => {
      if (selectedBranchToDelete?.project_ref === ref) {
        toast.success(
          'Successfully deleted branch. You are now currently on the main branch of your project.'
        )
        router.push(`/project/${projectRef}/branches`)
      } else {
        toast.success('Successfully deleted branch')
      }
      setSelectedBranchToDelete(undefined)
    },
  })

  const { mutate: disableBranching, isLoading: isDisabling } = useBranchesDisableMutation({
    onSuccess: () => {
      toast.success('Successfully disabled branching for project')
      setShowDisableBranching(false)
    },
  })

  const { mutate: updateBranch, isLoading: isUpdating } = useBranchUpdateMutation({
    onError: () => {
      toast.error(`Failed to update the branch`)
    },
  })

  const handleMarkBranchForReview = (branch: Branch) => {
    if (branch.id && projectRef) {
      updateBranch(
        {
          id: branch.id,
          projectRef,
          requestReview: true,
        },
        {
          onSuccess: () => {
            toast.success('Branch marked as ready for review')
            router.push(`/project/${branch.project_ref}/merge`)
          },
        }
      )
    }
  }

  const generateCreatePullRequestURL = (branch?: string) => {
    if (githubConnection === undefined) return 'https://github.com'

    return branch !== undefined
      ? `https://github.com/${githubConnection.repository.name}/compare/${mainBranch?.git_branch}...${branch}`
      : `https://github.com/${githubConnection.repository.name}/compare`
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

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldSection>
          <div className="col-span-12">
            <h3 className="text-xl mb-8">Branches</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center -space-x-px">
                  <Button
                    type="default"
                    className={`rounded-r-none transition hover:opacity-90 ${
                      tab === 'overview' ? 'opacity-100' : 'opacity-60'
                    }`}
                    onClick={() => setTab('overview')}
                  >
                    Overview
                  </Button>
                  <Button
                    type="default"
                    className={`rounded-none transition hover:opacity-90 ${
                      tab === 'prs' ? 'opacity-100' : 'opacity-60'
                    }`}
                    onClick={() => setTab('prs')}
                  >
                    Merge requests
                  </Button>
                  <Button
                    type="default"
                    className={`rounded-l-none transition hover:opacity-90 ${
                      tab === 'branches' ? 'opacity-100' : 'opacity-60'
                    }`}
                    onClick={() => setTab('branches')}
                  >
                    All branches
                  </Button>
                </div>
                <div className="flex items-center justify-between gap-x-2">
                  <Button
                    asChild
                    type="text"
                    icon={<MessageCircle className="text-muted" strokeWidth={1} />}
                  >
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href="https://github.com/orgs/supabase/discussions/18937"
                    >
                      Branching Feedback
                    </a>
                  </Button>
                  <DocsButton href="https://supabase.com/docs/guides/platform/branching" />
                  <ButtonTooltip
                    type="primary"
                    disabled={!canCreateBranches}
                    onClick={() => snap.setShowCreateBranchModal(true)}
                    tooltip={{
                      content: {
                        side: 'bottom',
                        text: !canCreateBranches
                          ? 'You need additional permissions to create branches'
                          : undefined,
                      },
                    }}
                  >
                    Create branch
                  </ButtonTooltip>
                </div>
              </div>

              {!canReadBranches ? (
                <NoPermission resourceText="view this project's branches" />
              ) : (
                <>
                  {isErrorConnections && (
                    <AlertError
                      error={connectionsError}
                      subject="Failed to retrieve GitHub integration connection"
                    />
                  )}

                  {isSuccessConnections && hasBranchEnabled && <GitHubStatus />}

                  {isErrorBranches && tab === 'overview' && (
                    <AlertError
                      error={branchesError}
                      subject="Failed to retrieve preview branches"
                    />
                  )}

                  {!isError && (
                    <>
                      {tab === 'overview' && (
                        <Overview
                          isLoading={isLoading}
                          isSuccess={isSuccess}
                          repo={repo}
                          mainBranch={mainBranch}
                          previewBranches={previewBranches}
                          onViewAllBranches={() => setTab('branches')}
                          onSelectCreateBranch={() => snap.setShowCreateBranchModal(true)}
                          onSelectDeleteBranch={setSelectedBranchToDelete}
                          generateCreatePullRequestURL={generateCreatePullRequestURL}
                          showProductionBranch={hasBranchEnabled}
                        />
                      )}
                      {tab === 'prs' && (
                        <div className="space-y-4">
                          {gitlessBranching && (
                            <BranchManagementSection
                              header={
                                <div className="flex items-center justify-between w-full">
                                  <span>
                                    {branchesReadyForReview.length} branches ready for review
                                  </span>
                                  <BranchSelector
                                    branches={previewBranches}
                                    onBranchSelected={handleMarkBranchForReview}
                                    disabled={!projectRef}
                                    isUpdating={isUpdating}
                                  />
                                </div>
                              }
                            >
                              {isBranch && !isCurrentBranchReadyForReview && currentBranch && (
                                <div className="bg-background px-6 py-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-foreground-light">
                                      <GitMerge
                                        strokeWidth={1.5}
                                        size={16}
                                        className="text-brand"
                                      />
                                      Mark{' '}
                                      <span className="text-foreground">{currentBranch.name}</span>{' '}
                                      ready for review
                                    </div>
                                    <Button
                                      type="primary"
                                      size="tiny"
                                      onClick={() =>
                                        currentBranch && handleMarkBranchForReview(currentBranch)
                                      }
                                    >
                                      Ready for review
                                    </Button>
                                  </div>
                                </div>
                              )}
                              {branchesReadyForReview.length > 0 ? (
                                branchesReadyForReview.map((branch) => {
                                  return <ReviewRow key={branch.id} branch={branch} />
                                })
                              ) : (
                                <div className="px-6 py-4 text-sm text-foreground-light">
                                  No branches are currently ready for review
                                </div>
                              )}
                            </BranchManagementSection>
                          )}
                          <BranchManagementSection
                            header={`${branchesWithPRs.length} branches with pull requests`}
                          >
                            {branchesWithPRs.length > 0 ? (
                              branchesWithPRs.map((branch) => {
                                return (
                                  <BranchRow
                                    key={branch.id}
                                    repo={repo}
                                    branch={branch}
                                    generateCreatePullRequestURL={generateCreatePullRequestURL}
                                    onSelectDeleteBranch={() => setSelectedBranchToDelete(branch)}
                                  />
                                )
                              })
                            ) : (
                              <PullRequestsEmptyState
                                url={generateCreatePullRequestURL()}
                                projectRef={projectRef ?? '_'}
                                hasBranches={previewBranches.length > 0}
                                githubConnection={githubConnection}
                                gitlessBranching={gitlessBranching}
                              />
                            )}
                          </BranchManagementSection>
                        </div>
                      )}
                      {tab === 'branches' && (
                        <BranchManagementSection
                          header={`${previewBranches.length} branches found`}
                        >
                          {isLoadingBranches && <BranchLoader />}
                          {isErrorBranches && (
                            <AlertError
                              error={branchesError}
                              subject="Failed to retrieve preview branches"
                            />
                          )}
                          {isSuccessBranches && previewBranches.length === 0 && (
                            <PreviewBranchesEmptyState
                              onSelectCreateBranch={() => snap.setShowCreateBranchModal(true)}
                            />
                          )}
                          {isSuccessBranches &&
                            previewBranches.map((branch) => {
                              return (
                                <BranchRow
                                  key={branch.id}
                                  repo={repo}
                                  branch={branch}
                                  generateCreatePullRequestURL={generateCreatePullRequestURL}
                                  onSelectDeleteBranch={() => setSelectedBranchToDelete(branch)}
                                />
                              )
                            })}
                        </BranchManagementSection>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </ScaffoldSection>
      </ScaffoldContainer>

      <TextConfirmModal
        variant={'warning'}
        visible={selectedBranchToDelete !== undefined}
        onCancel={() => setSelectedBranchToDelete(undefined)}
        onConfirm={() => onConfirmDeleteBranch()}
        loading={isDeleting}
        title="Delete branch"
        confirmLabel="Delete branch"
        confirmPlaceholder="Type in name of branch"
        confirmString={selectedBranchToDelete?.name ?? ''}
        alert={{ title: 'You cannot recover this branch once deleted' }}
        text={
          <>
            This will delete your database preview branch{' '}
            <span className="text-bold text-foreground">{selectedBranchToDelete?.name}</span>.
          </>
        }
      />

      <ConfirmationModal
        variant={'destructive'}
        size="medium"
        loading={isDisabling}
        visible={showDisableBranching}
        title="Confirm disable branching for project"
        confirmLabel="Confirm disable branching"
        confirmLabelLoading="Disabling branching..."
        onConfirm={() => onConfirmDisableBranching()}
        onCancel={() => setShowDisableBranching(false)}
        alert={{
          title: 'This action cannot be undone',
          description:
            'All database preview branches will be removed upon disabling branching. You may still re-enable branching again thereafter, but your existing preview branches will not be restored.',
        }}
      >
        <p className="text-sm">Before you disable branching, consider:</p>
        <ul className="space-y-2 mt-2 text-sm text-foreground-light">
          <li className="list-disc ml-6">Your project no longer requires database previews.</li>
          <li className="list-disc ml-6">
            None of your database previews are currently being used in any app.
          </li>
        </ul>
      </ConfirmationModal>
    </>
  )
}

export default BranchManagement
