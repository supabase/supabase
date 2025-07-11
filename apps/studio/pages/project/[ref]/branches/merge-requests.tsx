import { PermissionAction } from '@supabase/shared-types/out/constants'
import { partition } from 'lodash'
import { GitMerge, MessageCircle, X, MoreVertical } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import BranchLayout from 'components/layouts/BranchLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import AlertError from 'components/ui/AlertError'
import { DocsButton } from 'components/ui/DocsButton'
import NoPermission from 'components/ui/NoPermission'
import { useBranchDeleteMutation } from 'data/branches/branch-delete-mutation'
import { useBranchUpdateMutation } from 'data/branches/branch-update-mutation'
import { Branch, useBranchesQuery } from 'data/branches/branches-query'
import { useGitHubConnectionsQuery } from 'data/integrations/github-connections-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useFlag } from 'hooks/ui/useFlag'
import { useAppStateSnapshot } from 'state/app-state'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  Tooltip,
} from 'ui'
import TextConfirmModal from 'ui-patterns/Dialogs/TextConfirmModal'
import {
  BranchManagementSection,
  BranchRow,
} from 'components/interfaces/BranchManagement/BranchPanels'
import { BranchSelector } from 'components/interfaces/BranchManagement/BranchSelector'
import { PullRequestsEmptyState } from 'components/interfaces/BranchManagement/EmptyStates'
import type { NextPageWithLayout } from 'types'

const MergeRequestsPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams()
  const project = useSelectedProject()
  const selectedOrg = useSelectedOrganization()
  const gitlessBranching = useFlag('gitlessBranching')

  const hasBranchEnabled = project?.is_branch_enabled

  const isBranch = project?.parent_project_ref !== undefined
  const projectRef =
    project !== undefined ? (isBranch ? project.parent_project_ref : ref) : undefined

  const snap = useAppStateSnapshot()

  const [selectedBranchToDelete, setSelectedBranchToDelete] = useState<Branch>()

  const canReadBranches = useCheckPermissions(PermissionAction.READ, 'preview_branches')

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

  // Combined list of branches that are either ready for review or have an open pull request
  // If the gitlessBranching feature flag is disabled we only surface pull-request branches (the
  // previous behaviour). When the flag is enabled we also include review-ready branches.
  const mergeRequestBranches = gitlessBranching
    ? previewBranches.filter(
        (branch) =>
          branch.pr_number !== undefined ||
          (branch.review_requested_at !== undefined && branch.review_requested_at !== null)
      )
    : branchesWithPRs

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
      toast.success('Successfully deleted branch')
      setSelectedBranchToDelete(undefined)
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

  const handleCloseMergeRequest = (branch: Branch) => {
    if (branch.id && projectRef) {
      updateBranch(
        {
          id: branch.id,
          projectRef,
          requestReview: false,
        },
        {
          onSuccess: () => {
            toast.success('Branch marked as not ready for review')
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

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldSection>
          <div className="col-span-12">
            <div className="space-y-4">
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

                  {isErrorBranches && (
                    <AlertError
                      error={branchesError}
                      subject="Failed to retrieve preview branches"
                    />
                  )}

                  {!isError && (
                    <div className="space-y-4">
                      {gitlessBranching && (
                        <>
                          {isBranch && !isCurrentBranchReadyForReview && currentBranch && (
                            <div className="rounded border rounded-lg bg-background px-6 py-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-foreground-light">
                                  <GitMerge strokeWidth={1.5} size={16} className="text-brand" />
                                  <span className="text-foreground">{currentBranch.name}</span>
                                  last viewed
                                </div>
                                <Button
                                  type="primary"
                                  size="tiny"
                                  onClick={() =>
                                    currentBranch && handleMarkBranchForReview(currentBranch)
                                  }
                                >
                                  Merge request
                                </Button>
                              </div>
                            </div>
                          )}
                          {/* Combined list of review-ready branches and branches with PRs */}
                        </>
                      )}
                      <BranchManagementSection
                        header={`${mergeRequestBranches.length} merge requests`}
                      >
                        {mergeRequestBranches.length > 0 ? (
                          mergeRequestBranches.map((branch) => {
                            const isPR = branch.pr_number !== undefined
                            const rowLink = isPR
                              ? `https://github.com/${repo}/pull/${branch.pr_number}`
                              : `/project/${branch.project_ref}/merge`
                            return (
                              <BranchRow
                                key={branch.id}
                                repo={repo}
                                branch={branch}
                                generateCreatePullRequestURL={generateCreatePullRequestURL}
                                onSelectDeleteBranch={() => setSelectedBranchToDelete(branch)}
                                rowLink={rowLink}
                                external={isPR}
                                rowActions={
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        type="text"
                                        icon={<MoreVertical />}
                                        className="px-1"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56" side="bottom" align="end">
                                      <Tooltip>
                                        <DropdownMenuItem
                                          className="gap-x-2"
                                          disabled={isUpdating}
                                          onSelect={(e) => {
                                            e.stopPropagation()
                                            handleCloseMergeRequest(branch)
                                          }}
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleCloseMergeRequest(branch)
                                          }}
                                        >
                                          <X size={14} /> Close this merge request
                                        </DropdownMenuItem>
                                      </Tooltip>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                }
                              />
                            )
                          })
                        ) : (
                          <PullRequestsEmptyState
                            url={generateCreatePullRequestURL()}
                            projectRef={projectRef ?? '_'}
                            branches={previewBranches}
                            onBranchSelected={handleMarkBranchForReview}
                            isUpdating={isUpdating}
                            githubConnection={githubConnection}
                          />
                        )}
                      </BranchManagementSection>
                    </div>
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
    </>
  )
}

MergeRequestsPage.getLayout = (page) => {
  const MergeRequestsPageWrapper = () => {
    const router = useRouter()
    const { ref } = useParams()
    const project = useSelectedProject()
    const isBranch = project?.parent_project_ref !== undefined
    const projectRef =
      project !== undefined ? (isBranch ? project.parent_project_ref : ref) : undefined
    const { data: branches } = useBranchesQuery({ projectRef })
    const previewBranches = (branches || []).filter((b) => !b.is_default)
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
    const canCreateBranches = useCheckPermissions(PermissionAction.CREATE, 'preview_branches', {
      resource: { is_default: false },
    })
    const primaryActions = (
      <BranchSelector
        branches={previewBranches}
        onBranchSelected={handleMarkBranchForReview}
        disabled={!projectRef}
        isUpdating={isUpdating}
      />
    )
    const secondaryActions = (
      <div className="flex items-center gap-x-2">
        <Button asChild type="text" icon={<MessageCircle className="text-muted" strokeWidth={1} />}>
          <a
            target="_blank"
            rel="noreferrer"
            href="https://github.com/orgs/supabase/discussions/18937"
          >
            Branching Feedback
          </a>
        </Button>
        <DocsButton href="https://supabase.com/docs/guides/platform/branching" />
      </div>
    )
    return (
      <PageLayout
        title="Merge requests"
        subtitle="Manage branch merge requests and reviews"
        primaryActions={primaryActions}
        secondaryActions={secondaryActions}
      >
        {page}
      </PageLayout>
    )
  }
  return (
    <DefaultLayout>
      <BranchLayout>
        <MergeRequestsPageWrapper />
      </BranchLayout>
    </DefaultLayout>
  )
}

export default MergeRequestsPage
