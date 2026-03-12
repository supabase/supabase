import { PermissionAction } from '@supabase/shared-types/out/constants'
import { partition } from 'lodash'
import { ArrowRight, GitMerge, MessageCircle, MoreVertical, Shield, X } from 'lucide-react'
import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useIsBranching2Enabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import {
  BranchManagementSection,
  BranchRow,
} from 'components/interfaces/BranchManagement/BranchPanels'
import { BranchSelector } from 'components/interfaces/BranchManagement/BranchSelector'
import { PullRequestsEmptyState } from 'components/interfaces/BranchManagement/EmptyStates'
import BranchLayout from 'components/layouts/BranchLayout/BranchLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { DocsButton } from 'components/ui/DocsButton'
import NoPermission from 'components/ui/NoPermission'
import { useBranchUpdateMutation } from 'data/branches/branch-update-mutation'
import { Branch, useBranchesQuery } from 'data/branches/branches-query'
import { useGitHubConnectionsQuery } from 'data/integrations/github-connections-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import type { NextPageWithLayout } from 'types'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tooltip,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

const MergeRequestsPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: selectedOrg } = useSelectedOrganizationQuery()
  const gitlessBranching = useIsBranching2Enabled()

  const isBranch = project?.parent_project_ref !== undefined
  const projectRef =
    project !== undefined ? (isBranch ? project.parent_project_ref : ref) : undefined

  const { can: canReadBranches, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'preview_branches'
  )

  const {
    data: connections,
    error: connectionsError,
    isError: isErrorConnections,
  } = useGitHubConnectionsQuery({
    organizationId: selectedOrg?.id,
  })

  const {
    data: branches = [],
    error: branchesError,
    isPending: isLoadingBranches,
    isError: isErrorBranches,
    isSuccess: isSuccessBranches,
  } = useBranchesQuery({ projectRef })
  const [[mainBranch], previewBranchesUnsorted] = partition(branches, (branch) => branch.is_default)
  const previewBranches = previewBranchesUnsorted.sort((a, b) =>
    new Date(a.updated_at) < new Date(b.updated_at) ? 1 : -1
  )

  const mergeRequestBranches = previewBranches.filter(
    (branch) =>
      branch.pr_number !== undefined ||
      (branch.review_requested_at !== undefined && branch.review_requested_at !== null)
  )

  const currentBranch = branches?.find((branch) => branch.project_ref === ref)
  const isCurrentBranchReadyForReview = !!currentBranch?.review_requested_at

  const githubConnection = connections?.find((connection) => connection.project.ref === projectRef)
  const repo = githubConnection?.repository.name ?? ''

  const isError = isErrorConnections || isErrorBranches

  const isGithubConnected = githubConnection !== undefined

  const { mutate: sendEvent } = useSendEventMutation()

  const { mutate: updateBranch, isPending: isUpdating } = useBranchUpdateMutation({
    onError: () => {
      toast.error(`Failed to update the branch`)
    },
  })

  const handleMarkBranchForReview = ({
    project_ref: branchRef,
    parent_project_ref: projectRef,
    persistent,
  }: Branch) => {
    updateBranch(
      {
        branchRef,
        projectRef,
        requestReview: true,
      },
      {
        onSuccess: () => {
          toast.success('Merge request created')

          // Track merge request creation
          sendEvent({
            action: 'branch_create_merge_request_button_clicked',
            properties: {
              branchType: persistent ? 'persistent' : 'preview',
              origin: 'merge_page',
            },
            groups: {
              project: projectRef ?? 'Unknown',
              organization: selectedOrg?.slug ?? 'Unknown',
            },
          })

          router.push(`/project/${branchRef}/merge`)
        },
      }
    )
  }

  const handleCloseMergeRequest = ({
    project_ref: branchRef,
    parent_project_ref: projectRef,
  }: Branch) => {
    updateBranch(
      {
        branchRef,
        projectRef,
        requestReview: false,
      },
      {
        onSuccess: () => {
          toast.success('Merge request closed')

          // Track merge request closed
          sendEvent({
            action: 'branch_close_merge_request_button_clicked',
            groups: {
              project: projectRef ?? 'Unknown',
              organization: selectedOrg?.slug ?? 'Unknown',
            },
          })
        },
      }
    )
  }

  const generateCreatePullRequestURL = (branch?: string) => {
    if (githubConnection === undefined) return 'https://github.com'

    return branch !== undefined
      ? `https://github.com/${githubConnection.repository.name}/compare/${mainBranch?.git_branch}...${branch}`
      : `https://github.com/${githubConnection.repository.name}/compare`
  }

  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <div className="col-span-12">
          <div className="space-y-4">
            {isPermissionsLoaded && !canReadBranches ? (
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
                  <AlertError error={branchesError} subject="Failed to retrieve preview branches" />
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
                                loading={currentBranch && isUpdating}
                                onClick={() =>
                                  currentBranch && handleMarkBranchForReview(currentBranch)
                                }
                              >
                                Create merge request
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    <BranchManagementSection
                      header={`${mergeRequestBranches.length} merge requests`}
                    >
                      {isLoadingBranches ? (
                        <div className="p-4">
                          <GenericSkeletonLoader />
                        </div>
                      ) : mergeRequestBranches.length > 0 ? (
                        mergeRequestBranches.map((branch) => {
                          const isPR = branch.pr_number !== undefined
                          const rowLink = isPR
                            ? `https://github.com/${repo}/pull/${branch.pr_number}`
                            : `/project/${branch.project_ref}/merge`
                          return (
                            <BranchRow
                              isGithubConnected={isGithubConnected}
                              key={branch.id}
                              label={
                                <div className="flex items-center gap-x-4">
                                  {branch.name}
                                  <ArrowRight
                                    size={14}
                                    strokeWidth={1.5}
                                    className="text-foreground-lighter"
                                  />
                                  <div className="flex items-center gap-x-2">
                                    {branch.pr_number ? (
                                      <p className="text-foreground-lighter">#{branch.pr_number}</p>
                                    ) : (
                                      <>
                                        <Shield
                                          size={14}
                                          strokeWidth={1.5}
                                          className="text-warning"
                                        />
                                        <p className="text-foreground-lighter">{mainBranch.name}</p>
                                      </>
                                    )}
                                  </div>
                                </div>
                              }
                              repo={repo}
                              branch={branch}
                              rowLink={rowLink}
                              external={isPR}
                              rowActions={
                                // We always want to show the action button to close a merge request
                                // when user has requested review from dashboard. It doesn't matter
                                // whether the branch is linked to a GitHub PR.
                                branch.review_requested_at && (
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
                                        >
                                          <X size={14} /> Close this merge request
                                        </DropdownMenuItem>
                                      </Tooltip>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )
                              }
                            />
                          )
                        })
                      ) : (
                        <PullRequestsEmptyState
                          url={generateCreatePullRequestURL()}
                          gitlessBranching={gitlessBranching}
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
  )
}

const MergeRequestsPageWrapper = ({ children }: PropsWithChildren<{}>) => {
  const router = useRouter()
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: selectedOrg } = useSelectedOrganizationQuery()
  const gitlessBranching = useIsBranching2Enabled()

  const isBranch = project?.parent_project_ref !== undefined
  const projectRef =
    project !== undefined ? (isBranch ? project.parent_project_ref : ref) : undefined

  const { data: branches } = useBranchesQuery({ projectRef })
  const previewBranches = (branches || []).filter((b) => !b.is_default)

  const { mutate: sendEvent } = useSendEventMutation()

  const { mutate: updateBranch, isPending: isUpdating } = useBranchUpdateMutation({
    onError: () => {
      toast.error(`Failed to update the branch`)
    },
  })

  const handleMarkBranchForReview = ({
    project_ref: branchRef,
    parent_project_ref: projectRef,
    persistent,
  }: Branch) => {
    updateBranch(
      {
        branchRef,
        projectRef,
        requestReview: true,
      },
      {
        onSuccess: () => {
          toast.success('Merge request created')

          // Track merge request creation
          sendEvent({
            action: 'branch_create_merge_request_button_clicked',
            properties: {
              branchType: persistent ? 'persistent' : 'preview',
              origin: 'branch_selector',
            },
            groups: {
              project: projectRef ?? 'Unknown',
              organization: selectedOrg?.slug ?? 'Unknown',
            },
          })

          router.push(`/project/${branchRef}/merge`)
        },
      }
    )
  }

  const primaryActions = gitlessBranching ? (
    <BranchSelector
      branches={previewBranches}
      onBranchSelected={handleMarkBranchForReview}
      disabled={!projectRef}
      isUpdating={isUpdating}
    />
  ) : null

  const secondaryActions = (
    <div className="flex items-center gap-x-2">
      <Button asChild type="text" icon={<MessageCircle className="text-muted" strokeWidth={1} />}>
        <a
          target="_blank"
          rel="noreferrer"
          href="https://github.com/orgs/supabase/discussions/18937"
        >
          Branching feedback
        </a>
      </Button>
      <DocsButton href={`${DOCS_URL}/guides/platform/branching`} />
    </div>
  )

  return (
    <PageLayout
      title="Merge requests"
      subtitle="Review and merge changes from one branch into another"
      primaryActions={primaryActions}
      secondaryActions={secondaryActions}
    >
      {children}
    </PageLayout>
  )
}

MergeRequestsPage.getLayout = (page) => {
  return (
    <DefaultLayout>
      <BranchLayout>
        <MergeRequestsPageWrapper>{page}</MergeRequestsPageWrapper>
      </BranchLayout>
    </DefaultLayout>
  )
}

export default MergeRequestsPage
