import Link from 'next/link'
import { Button, IconExternalLink, IconGitBranch } from 'ui'

import { useParams } from 'common'
import { Branch, useBranchesQuery } from 'data/branches/branches-query'
import { useGithubPullRequestsQuery } from 'data/integrations/integrations-github-pull-requests-query'
import { useOrgIntegrationsQuery } from 'data/integrations/integrations-query-org-only'
import { useSelectedOrganization } from 'hooks'
import { BranchContainer, BranchHeader, PullRequestPanel } from './BranchPanels'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import AlertError from 'components/ui/AlertError'

interface PullRequestsProps {
  previewBranches: Branch[]
  generateCreatePullRequestURL: (branch?: string) => string
  onSelectDeleteBranch: (branch: Branch) => void
}

const PullRequests = ({
  previewBranches,
  generateCreatePullRequestURL,
  onSelectDeleteBranch,
}: PullRequestsProps) => {
  const { ref } = useParams()
  const selectedOrg = useSelectedOrganization()
  const pullRequestUrl = generateCreatePullRequestURL()

  const { data: integrations, isLoading: isLoadingIntegrations } = useOrgIntegrationsQuery({
    orgSlug: selectedOrg?.slug,
  })
  const githubIntegration = integrations?.find(
    (integration) =>
      integration.integration.name === 'GitHub' &&
      integration.organization.slug === selectedOrg?.slug
  )

  const githubConnection = githubIntegration?.connections?.find(
    (connection) => connection.supabase_project_ref === ref
  )
  const [repoOwner, repoName] = githubConnection?.metadata.name.split('/') || []

  const { data: branches, isLoading: isLoadingBranches } = useBranchesQuery({ projectRef: ref })
  const mainBranch = branches?.find((branch) => branch.is_default)

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
    target: mainBranch?.git_branch,
  })
  const pullRequests = allPullRequests?.filter((pr) =>
    branches?.some((branch) => branch.git_branch === pr.branch)
  )

  const showEmptyState = previewBranches.length === 0 || (pullRequests || []).length === 0

  return (
    <>
      <BranchHeader
        markdown={!showEmptyState ? `#### Preview branches in pull requests` : undefined}
      />

      {(isLoadingBranches || isLoadingPullRequests || isLoadingIntegrations) && (
        <BranchContainer>
          <div className="w-full">
            <GenericSkeletonLoader />
          </div>
        </BranchContainer>
      )}

      {isErrorPullRequests && (
        <BranchContainer>
          <div className="w-full">
            <AlertError
              error={pullRequestsError}
              subject="Failed to retrieve GitHub pull requests"
            />
          </div>
        </BranchContainer>
      )}

      {isSuccessPullRequests && (
        <>
          {showEmptyState ? (
            <BranchContainer>
              <div className="flex items-center flex-col justify-center w-full py-8">
                <p>No pull requests made yet for this repository</p>
                <p className="text-scale-1000">
                  Only pull requests with the ./migration directory changes will show here.
                </p>
                {previewBranches.length > 0 && (
                  <div className="w-96 border rounded-md mt-4">
                    <div className="px-5 py-3 bg-surface-100 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <IconGitBranch strokeWidth={2} className="text-scale-1100" />
                        <p>Create a pull request</p>
                      </div>
                      <Link passHref href={pullRequestUrl}>
                        <a target="_blank" rel="noreferrer">
                          <Button type="default" iconRight={<IconExternalLink />}>
                            Github
                          </Button>
                        </a>
                      </Link>
                    </div>
                    <div className="px-5 py-3 border-t flex items-center justify-between">
                      <div>
                        <p>Not sure what to do?</p>
                        <p className="text-scale-1000">Browse our documentation</p>
                      </div>
                      <Button type="default" iconRight={<IconExternalLink />}>
                        Docs
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </BranchContainer>
          ) : (
            pullRequests?.map((pr) => {
              const branch = branches?.find((branch) => branch.git_branch === pr.branch)
              return (
                <PullRequestPanel
                  key={pr.id}
                  pr={pr}
                  onSelectDelete={() => {
                    if (branch !== undefined) onSelectDeleteBranch(branch)
                  }}
                />
              )
            })
          )}
        </>
      )}
    </>
  )
}

export default PullRequests
