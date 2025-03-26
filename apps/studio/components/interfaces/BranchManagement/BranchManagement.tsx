import { PermissionAction } from '@supabase/shared-types/out/constants'
import { partition } from 'lodash'
import { ExternalLink, Github, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { DocsButton } from 'components/ui/DocsButton'
import NoPermission from 'components/ui/NoPermission'
import { useBranchDeleteMutation } from 'data/branches/branch-delete-mutation'
import { useBranchesDisableMutation } from 'data/branches/branches-disable-mutation'
import { Branch, useBranchesQuery } from 'data/branches/branches-query'
import { useGitHubConnectionsQuery } from 'data/integrations/github-connections-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useUrlState } from 'hooks/ui/useUrlState'
import { Button } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import TextConfirmModal from 'ui-patterns/Dialogs/TextConfirmModal'
import { BranchLoader, BranchManagementSection, BranchRow } from './BranchPanels'
import CreateBranchModal from './CreateBranchModal'
import {
  BranchingEmptyState,
  PreviewBranchesEmptyState,
  PullRequestsEmptyState,
} from './EmptyStates'
import Overview from './Overview'

type Tab = 'overview' | 'prs' | 'branches'

const BranchManagement = () => {
  const router = useRouter()
  const { ref } = useParams()
  const project = useSelectedProject()
  const selectedOrg = useSelectedOrganization()

  const hasBranchEnabled = project?.is_branch_enabled

  const isBranch = project?.parent_project_ref !== undefined
  const projectRef =
    project !== undefined ? (isBranch ? project.parent_project_ref : ref) : undefined

  const [urlParams, setParams] = useUrlState<{ tab: Tab }>()
  const tab = urlParams.tab ?? 'overview'
  const setTab = (tab: Tab) => setParams({ tab })

  const [showCreateBranch, setShowCreateBranch] = useState(false)
  const [showDisableBranching, setShowDisableBranching] = useState(false)
  const [selectedBranchToDelete, setSelectedBranchToDelete] = useState<Branch>()

  const canReadBranches = useCheckPermissions(PermissionAction.READ, 'preview_branches')
  const canCreateBranches = useCheckPermissions(PermissionAction.CREATE, 'preview_branches', {
    resource: { is_default: false },
  })
  const canDisableBranching = useCheckPermissions(PermissionAction.DELETE, 'preview_branches', {
    resource: { is_default: true },
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

  if (!hasBranchEnabled) return <BranchingEmptyState />

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
                    Pull requests
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
                    onClick={() => setShowCreateBranch(true)}
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

                  {isSuccessConnections && (
                    <div className="border rounded-lg px-6 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-x-4">
                        <div className="w-8 h-8 bg-scale-300 border rounded-md flex items-center justify-center">
                          <Github size={18} strokeWidth={2} />
                        </div>
                        <p className="text-sm">GitHub branch workflow</p>
                        <Button asChild type="default" iconRight={<ExternalLink size={14} />}>
                          <Link passHref href={`/project/${ref}/settings/integrations`}>
                            Settings
                          </Link>
                        </Button>
                        <Button
                          type="text"
                          size="small"
                          className="text-light hover:text py-1 px-1.5"
                          iconRight={<ExternalLink size={14} strokeWidth={1.5} />}
                        >
                          <Link
                            passHref
                            target="_blank"
                            rel="noreferrer"
                            href={`https://github.com/${repo}`}
                          >
                            {repo}
                          </Link>
                        </Button>
                      </div>
                      <ButtonTooltip
                        type="default"
                        disabled={!canDisableBranching}
                        onClick={() => setShowDisableBranching(true)}
                        tooltip={{
                          content: {
                            side: 'bottom',
                            text: !canDisableBranching
                              ? 'You need additional permissions to disable branching'
                              : undefined,
                          },
                        }}
                      >
                        Disable branching
                      </ButtonTooltip>
                    </div>
                  )}

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
                          onSelectCreateBranch={() => setShowCreateBranch(true)}
                          onSelectDeleteBranch={setSelectedBranchToDelete}
                          generateCreatePullRequestURL={generateCreatePullRequestURL}
                        />
                      )}
                      {tab === 'prs' && (
                        <BranchManagementSection
                          header={`${branchesWithPRs.length} branches with pull requests found`}
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
                              hasBranches={previewBranches.length > 0}
                            />
                          )}
                        </BranchManagementSection>
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
                              onSelectCreateBranch={() => setShowCreateBranch(true)}
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

      <CreateBranchModal visible={showCreateBranch} onClose={() => setShowCreateBranch(false)} />
    </>
  )
}

export default BranchManagement
