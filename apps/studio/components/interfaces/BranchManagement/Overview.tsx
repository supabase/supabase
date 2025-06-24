import { noop } from 'lodash'
import { Button } from 'ui'

import type { Branch } from 'data/branches/branches-query'
import { ChevronRight } from 'lucide-react'
import { BranchLoader, BranchManagementSection, BranchRow, BranchRowLoader } from './BranchPanels'
import { PreviewBranchesEmptyState } from './EmptyStates'

const MAX_BRANCHES_OVERVIEW = 10

interface OverviewProps {
  isLoading: boolean
  isSuccess: boolean
  repo: string
  mainBranch: Branch
  previewBranches: Branch[]
  onViewAllBranches: () => void
  onSelectCreateBranch: () => void
  onSelectDeleteBranch: (branch: Branch) => void
  generateCreatePullRequestURL: (branchName?: string) => string
  showProductionBranch?: boolean
}

export const Overview = ({
  isLoading,
  isSuccess,
  repo,
  mainBranch,
  previewBranches,
  onViewAllBranches,
  onSelectCreateBranch,
  onSelectDeleteBranch,
  generateCreatePullRequestURL,
  showProductionBranch = true,
}: OverviewProps) => {
  return (
    <>
      {showProductionBranch && (
        <BranchManagementSection header="Production branch">
          {isLoading && <BranchRowLoader />}
          {isSuccess && mainBranch !== undefined && (
            <BranchRow isMain branch={mainBranch} repo={repo} onSelectDeleteBranch={noop} />
          )}
        </BranchManagementSection>
      )}

      <BranchManagementSection
        header="Preview branches"
        footer={
          isSuccess && (
            <div className="flex items-center justify-center">
              <Button type="text" iconRight={<ChevronRight />} onClick={() => onViewAllBranches()}>
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
            return (
              <BranchRow
                key={branch.id}
                repo={repo}
                branch={branch}
                generateCreatePullRequestURL={generateCreatePullRequestURL}
                onSelectDeleteBranch={() => onSelectDeleteBranch(branch)}
              />
            )
          })}
      </BranchManagementSection>
    </>
  )
}
