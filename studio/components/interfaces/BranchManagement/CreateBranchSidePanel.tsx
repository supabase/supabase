import { useEffect, useState } from 'react'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  IconExternalLink,
  IconGitBranch,
  IconSearch,
  Input,
  SidePanel,
} from 'ui'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import NoSearchResults from 'components/ui/NoSearchResults'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useBranchCreateMutation } from 'data/branches/branch-create-mutation'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useGithubBranchesQuery } from 'data/integrations/integrations-github-branches-query'
import { useOrgIntegrationsQuery } from 'data/integrations/integrations-query-org-only'
import { useSelectedOrganization, useSelectedProject, useStore } from 'hooks'
import Link from 'next/link'

interface CreateBranchSidePanelProps {
  visible: boolean
  onClose: () => void
}

// [Joshen] Optimization: Remove Form component, just use Combobox

const CreateBranchSidePanel = ({ visible, onClose }: CreateBranchSidePanelProps) => {
  const { ui } = useStore()
  const { ref } = useParams()
  const projectDetails = useSelectedProject()
  const selectedOrg = useSelectedOrganization()

  const [searchValue, setSearchValue] = useState('')
  const [selectedBranch, setSelectedBranch] = useState<string>()

  useEffect(() => {
    if (visible) {
      setSelectedBranch(undefined)
    }
  }, [visible])

  const isBranch = projectDetails?.parent_project_ref !== undefined
  const projectRef =
    projectDetails !== undefined ? (isBranch ? projectDetails.parent_project_ref : ref) : undefined

  const { data: branches } = useBranchesQuery({ projectRef })
  const {
    data: integrations,
    error: integrationsError,
    isLoading: isLoadingIntegrations,
    isSuccess: isSuccessIntegrations,
    isError: isErrorIntegrations,
  } = useOrgIntegrationsQuery({
    orgSlug: selectedOrg?.slug,
  })
  const githubIntegration = integrations?.find(
    (integration) =>
      integration.integration.name === 'GitHub' &&
      integration.connections.some((connection) => connection.supabase_project_ref === ref)
  )

  const githubConnection = githubIntegration?.connections?.find(
    (connection) => connection.supabase_project_ref === ref
  )
  const [repoOwner, repoName] = githubConnection?.metadata.name.split('/') || []
  const {
    data: githubBranches,
    error: githubBranchesError,
    isLoading: isLoadingBranches,
    isSuccess: isSuccessBranches,
    isError: isErrorBranches,
  } = useGithubBranchesQuery({
    organizationIntegrationId: githubIntegration?.id,
    repoOwner,
    repoName,
  })
  const branchOptions =
    searchValue.length > 0
      ? (githubBranches || [])?.filter((branch) => branch.name.includes(searchValue))
      : githubBranches || []

  const { mutate: createBranch, isLoading: isCreating } = useBranchCreateMutation({
    onSuccess: () => {
      ui.setNotification({ category: 'success', message: `Successfully created new branch` })
      onClose()
    },
  })

  const onCreateBranch = (branch: string) => {
    if (!projectRef) return console.error('Project ref is required')
    setSelectedBranch(branch)
    createBranch({ projectRef, branchName: branch, gitBranch: branch })
  }

  return (
    <SidePanel
      hideFooter
      size="large"
      visible={visible}
      loading={isCreating}
      onCancel={onClose}
      header="Create a new database preview branch"
    >
      <div className="py-6 space-y-4 ">
        <SidePanel.Content>
          {isLoadingIntegrations && <GenericSkeletonLoader />}
          {isSuccessIntegrations && (
            <div>
              <p className="text-sm text-scale-1100">
                Your project is currently connected to the repository:
              </p>
              <div className="flex items-center space-x-2">
                <p>{githubConnection?.metadata.name}</p>
                <Link passHref href={`https://github.com/${repoOwner}/${repoName}`}>
                  <a target="_blank" rel="noreferrer">
                    <IconExternalLink size={14} strokeWidth={1.5} />
                  </a>
                </Link>
              </div>
            </div>
          )}
        </SidePanel.Content>

        <SidePanel.Separator />

        <SidePanel.Content>
          <div>
            <p className="text-sm prose mb-2">
              Select a Git branch to create a database preview from
            </p>
            {(isLoadingIntegrations || isLoadingBranches) && <GenericSkeletonLoader />}
            {(isErrorIntegrations || isErrorBranches) && (
              <AlertError
                error={integrationsError || githubBranchesError}
                subject="Failed to retrieve Github branches"
              />
            )}
            {isSuccessIntegrations && isSuccessBranches && (
              <>
                <Input
                  placeholder="Search branch..."
                  className="mb-3"
                  value={searchValue}
                  icon={<IconSearch />}
                  onChange={(event) => setSearchValue(event.target.value)}
                />
                {branchOptions.length === 0 && searchValue.length === 0 && (
                  <Alert_Shadcn_ variant="default" className="!pl-4">
                    <AlertTitle_Shadcn_>No branches available in repository</AlertTitle_Shadcn_>
                    <AlertDescription_Shadcn_>
                      <p>Create a branch in the {repoName} repository on Github first</p>
                      <Link passHref href={`https://github.com/${repoOwner}/${repoName}`}>
                        <a target="_blank" rel="noreferrer">
                          <Button type="default" iconRight={<IconExternalLink />} className="mt-2">
                            Create a new branch on Github
                          </Button>
                        </a>
                      </Link>
                    </AlertDescription_Shadcn_>
                  </Alert_Shadcn_>
                )}
                {branchOptions.length === 0 && searchValue.length > 0 && (
                  <NoSearchResults
                    searchString={searchValue}
                    onResetFilter={() => setSearchValue('')}
                  />
                )}
                <div className="[&>*:first-child]:rounded-t-md">
                  {branchOptions?.map((branch) => {
                    const isProductionBranch = branches?.find(
                      (b) => b.git_branch === branch.name && b.is_default
                    )
                    const alreadyHasDatabaseBranch =
                      branches?.some((b) => b.git_branch === branch.name) ?? false
                    return (
                      <div
                        key={branch.name}
                        className="px-6 py-4 bg-surface-200 last:rounded-b-md border border-b-0 last:border-b"
                      >
                        <div className="w-full flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <IconGitBranch size={14} strokeWidth={1.5} />
                            <p className="text-sm">{branch.name}</p>
                          </div>
                          <Button
                            type={isProductionBranch ? 'warning' : 'default'}
                            loading={isCreating}
                            disabled={isCreating || alreadyHasDatabaseBranch}
                            onClick={() => onCreateBranch(branch.name)}
                            className={
                              selectedBranch !== undefined && selectedBranch !== branch.name
                                ? 'opacity-0'
                                : ''
                            }
                          >
                            {isProductionBranch
                              ? 'Production branch'
                              : alreadyHasDatabaseBranch
                              ? 'Branch already created'
                              : 'Create branch'}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </SidePanel.Content>
      </div>
    </SidePanel>
  )
}

export default CreateBranchSidePanel
