import { useParams } from 'common'
import { partition } from 'lodash'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  IconAlertTriangle,
  IconExternalLink,
  IconGitHub,
  IconSearch,
  Input,
  Modal,
} from 'ui'

import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import ConfirmationModal from 'components/ui/ConfirmationModal'
import TextConfirmModal from 'components/ui/Modals/TextConfirmModal'
import { useBranchDeleteMutation } from 'data/branches/branch-delete-mutation'
import { useBranchesDisableMutation } from 'data/branches/branches-disable-mutation'
import { Branch, useBranchesQuery } from 'data/branches/branches-query'
import { useGithubPullRequestsQuery } from 'data/integrations/integrations-github-pull-requests-query'
import { useOrgIntegrationsQuery } from 'data/integrations/integrations-query-org-only'
import { useSelectedOrganization, useSelectedProject, useStore } from 'hooks'
import { BranchLoader, BranchManagementSection, BranchRow } from './BranchPanels'
import CreateBranchModal from './CreateBranchModal'
import {
  BranchingEmptyState,
  PreviewBranchesEmptyState,
  PullRequestsEmptyState,
} from './EmptyStates'
import Overview from './Overview'

const BranchManagement = () => {
  const { ui } = useStore()
  const router = useRouter()
  const { ref } = useParams()
  const project = useSelectedProject()
  const selectedOrg = useSelectedOrganization()

  const hasBranchEnabled = project?.is_branch_enabled

  const isBranch = project?.parent_project_ref !== undefined
  const projectRef =
    project !== undefined ? (isBranch ? project.parent_project_ref : ref) : undefined

  const [view, setView] = useState<'overview' | 'prs' | 'branches'>('overview')
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
  const prNumbers =
    branches !== undefined
      ? (branchesWithPRs.map((branch) => branch.pr_number).filter(Boolean) as number[])
      : undefined

  const githubIntegration = integrations?.find(
    (integration) =>
      integration.integration.name === 'GitHub' &&
      integration.organization.slug === selectedOrg?.slug
  )
  const githubConnection = githubIntegration?.connections?.find(
    (connection) => connection.supabase_project_ref === projectRef
  )
  const repo = githubConnection?.metadata.name ?? ''
  const [repoOwner, repoName] = githubConnection?.metadata.name.split('/') || []

  const {
    data: allPullRequests,
    error: pullRequestsError,
    isLoading: isLoadingPullRequests,
    isError: isErrorPullRequests,
    isSuccess: isSuccessPullRequests,
  } = useGithubPullRequestsQuery({
    organizationIntegrationId: githubIntegration?.id,
    repoOwner,
    repoName,
    prNumbers,
  })
  const pullRequests = allPullRequests ?? []

  const isError = isErrorIntegrations || isErrorBranches
  const isLoading = isLoadingIntegrations || isLoadingBranches
  const isSuccess = isSuccessIntegrations && isSuccessBranches

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

  if (!hasBranchEnabled) return <BranchingEmptyState />

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldSection>
          <div className="col-span-12">
            <h3 className="text-xl mb-8">Branches</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Button
                      type="default"
                      className={`rounded-r-none transition hover:opacity-90 ${
                        view === 'overview' ? 'opacity-100' : 'opacity-60'
                      }`}
                      onClick={() => setView('overview')}
                    >
                      Overview
                    </Button>
                    <Button
                      type="default"
                      className={`rounded-none transition hover:opacity-90 ${
                        view === 'prs' ? 'opacity-100' : 'opacity-60'
                      }`}
                      onClick={() => setView('prs')}
                    >
                      Pull requests
                    </Button>
                    <Button
                      type="default"
                      className={`rounded-l-none transition hover:opacity-90 ${
                        view === 'branches' ? 'opacity-100' : 'opacity-60'
                      }`}
                      onClick={() => setView('branches')}
                    >
                      All branches
                    </Button>
                  </div>
                  <Input
                    size="tiny"
                    className="w-64"
                    placeholder="Search"
                    icon={<IconSearch size={14} strokeWidth={2} />}
                  />
                </div>
                <Button type="primary" onClick={() => setShowCreateBranch(true)}>
                  Create branch
                </Button>
              </div>

              {isErrorIntegrations && (
                <AlertError
                  error={integrationsError}
                  subject="Failed to retrieve GitHub integration connection"
                />
              )}

              {isSuccessIntegrations && (
                <div className="border rounded-lg px-6 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-x-4">
                    <div className="w-8 h-8 bg-scale-300 border rounded-md flex items-center justify-center">
                      <IconGitHub size={18} strokeWidth={2} />
                    </div>
                    <p className="text-sm">GitHub branch workflow</p>
                    <Button asChild type="default" iconRight={<IconExternalLink />}>
                      <Link passHref href={`/project/${ref}/settings/integrations`}>
                        Settings
                      </Link>
                    </Button>
                    <Button
                      type="text"
                      size="small"
                      className="text-light hover:text py-1 px-1.5"
                      iconRight={<IconExternalLink size={14} strokeWidth={1.5} />}
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
                  <Button type="default" onClick={() => setShowDisableBranching(true)}>
                    Disable branching
                  </Button>
                </div>
              )}

              {isErrorBranches && view === 'overview' && (
                <AlertError error={branchesError} subject="Failed to retrieve preview branches" />
              )}

              {!isError && (
                <>
                  {view === 'overview' && (
                    <Overview
                      isLoading={isLoading}
                      isSuccess={isSuccess}
                      repo={repo}
                      mainBranch={mainBranch}
                      previewBranches={previewBranches}
                      pullRequests={pullRequests}
                      onViewAllBranches={() => setView('branches')}
                      onSelectCreateBranch={() => setShowCreateBranch(true)}
                      onSelectDeleteBranch={setSelectedBranchToDelete}
                      generateCreatePullRequestURL={generateCreatePullRequestURL}
                    />
                  )}
                  {view === 'prs' && (
                    <BranchManagementSection
                      header={`${branchesWithPRs.length} branches with pull requests found`}
                    >
                      {isLoadingPullRequests && <BranchLoader />}
                      {isErrorPullRequests && (
                        <AlertError
                          error={pullRequestsError}
                          subject="Failed to retrieve GitHub pull requests"
                        />
                      )}
                      {isSuccessPullRequests && (
                        <>
                          {branchesWithPRs.length > 0 ? (
                            branchesWithPRs.map((branch) => {
                              const pullRequest = pullRequests?.find(
                                (pr) => pr.branch === branch.git_branch && pr.repo === repo
                              )
                              return (
                                <BranchRow
                                  key={branch.id}
                                  repo={repo}
                                  branch={branch}
                                  pullRequest={pullRequest}
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
                        </>
                      )}
                    </BranchManagementSection>
                  )}
                  {view === 'branches' && (
                    <BranchManagementSection header={`${previewBranches.length} branches found`}>
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
                          const pullRequest = pullRequests?.find(
                            (pr) => pr.branch === branch.git_branch && pr.repo === repo
                          )
                          return (
                            <BranchRow
                              key={branch.id}
                              repo={repo}
                              branch={branch}
                              pullRequest={pullRequest}
                              generateCreatePullRequestURL={generateCreatePullRequestURL}
                              onSelectDeleteBranch={() => setSelectedBranchToDelete(branch)}
                            />
                          )
                        })}
                    </BranchManagementSection>
                  )}
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
                  <ul className="space-y-2 mt-2 text-sm text-foreground-light">
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

      <CreateBranchModal visible={showCreateBranch} onClose={() => setShowCreateBranch(false)} />
    </>
  )
}

export default BranchManagement
