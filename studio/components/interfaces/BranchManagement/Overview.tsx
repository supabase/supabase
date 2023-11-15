import { noop } from 'lodash'
import { Button, IconChevronRight } from 'ui'

import { Branch } from 'data/branches/branches-query'
import { GitHubPullRequest } from 'data/integrations/integrations-github-pull-requests-query'
import { BranchLoader, BranchManagementSection, BranchRow, BranchRowLoader } from './BranchPanels'
import { PreviewBranchesEmptyState } from './EmptyStates'

const MAX_BRANCHES_OVERVIEW = 10

interface OverviewProps {
  isLoading: boolean
  isSuccess: boolean
  repo: string
  mainBranch: Branch
  previewBranches: Branch[]
  pullRequests: GitHubPullRequest[]
  onViewAllBranches: () => void
  onSelectCreateBranch: () => void
  onSelectDeleteBranch: (branch: Branch) => void
  generateCreatePullRequestURL: (branchName?: string) => string
}

const Overview = ({
  isLoading,
  isSuccess,
  repo,
  mainBranch,
  previewBranches,
  pullRequests,
  onViewAllBranches,
  onSelectCreateBranch,
  onSelectDeleteBranch,
  generateCreatePullRequestURL,
}: OverviewProps) => {
  return (
    <>
      <BranchManagementSection header="Production branch">
        {isLoading && <BranchRowLoader />}
        {isSuccess && mainBranch !== undefined && (
          <BranchRow isMain branch={mainBranch} repo={repo} onSelectDeleteBranch={noop} />
        )}
      </BranchManagementSection>

      <BranchManagementSection
        header="Preview branches"
        footer={
          isSuccess && (
            <div className="flex items-center justify-center">
              <Button
                type="text"
                iconRight={<IconChevronRight />}
                onClick={() => onViewAllBranches()}
              >
                View all branches
              </Button>
            </div>
          )
        }
      >
        {isLoading && <BranchLoader />}
        {isSuccess && previewBranches.length === 0 && (
          <PreviewBranchesEmptyState onSelectCreateBranch={onSelectCreateBranch} />
        )}
        {isSuccess &&
          previewBranches.slice(0, MAX_BRANCHES_OVERVIEW).map((branch) => {
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
                onSelectDeleteBranch={() => onSelectDeleteBranch(branch)}
              />
            )
          })}
      </BranchManagementSection>
    </>
  )
}

export default Overview
