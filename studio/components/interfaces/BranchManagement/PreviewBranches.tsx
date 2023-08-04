import { Button, IconExternalLink, IconGitBranch } from 'ui'

import { Branch } from 'data/branches/branches-query'
import { BranchContainer, BranchHeader, BranchPanel } from './BranchPanels'

interface PreviewBranchesProps {
  previewBranches: Branch[]
  generatePullRequestURL: (branch?: string) => string
  onSelectCreateBranch: () => void
  onSelectDeleteBranch: (branch: Branch) => void
}

const PreviewBranches = ({
  previewBranches,
  generatePullRequestURL,
  onSelectCreateBranch,
  onSelectDeleteBranch,
}: PreviewBranchesProps) => {
  return (
    <>
      <BranchHeader markdown={previewBranches.length > 0 ? `#### Preview branches` : undefined} />
      {previewBranches.length === 0 ? (
        <BranchContainer>
          <div className="flex items-center flex-col justify-center w-full py-8">
            <p>No database preview branches</p>
            <p className="text-scale-1000">Database preview branches will be shown here</p>
            <div className="w-[500px] border rounded-md mt-4">
              <div className="px-5 py-3 bg-surface-100 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <IconGitBranch strokeWidth={2} className="text-scale-1100" />
                  <div>
                    <p>Create a preview branch</p>
                    <p className="text-scale-1000">Start developing in preview</p>
                  </div>
                </div>
                <Button type="default" onClick={() => onSelectCreateBranch()}>
                  Create preview branch
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
          </div>
        </BranchContainer>
      ) : (
        previewBranches.map((branch) => (
          <BranchPanel
            key={branch.id}
            branch={branch}
            generatePullRequestURL={generatePullRequestURL}
            onSelectDelete={() => onSelectDeleteBranch(branch)}
          />
        ))
      )}
    </>
  )
}

export default PreviewBranches
