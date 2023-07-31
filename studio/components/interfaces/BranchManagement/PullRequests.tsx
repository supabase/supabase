import { Branch } from 'data/branches/branches-query'
import { BranchContainer, BranchHeader } from './BranchPanels'
import { Button, IconExternalLink, IconGitBranch } from 'ui'

interface PullRequestsProps {
  previewBranches: Branch[]
}

const PullRequests = ({ previewBranches }: PullRequestsProps) => {
  const pullRequests = []

  return (
    <>
      <BranchHeader
        markdown={
          pullRequests.length > 0 && previewBranches.length > 0
            ? `#### Open pull requests`
            : undefined
        }
      />
      {previewBranches.length === 0 || pullRequests.length === 0 ? (
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
                  <Button type="default" iconRight={<IconExternalLink />}>
                    Github
                  </Button>
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
        <BranchContainer>State 3</BranchContainer>
      )}
    </>
  )
}

export default PullRequests
