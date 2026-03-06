import type { Branch } from 'data/branches/branches-query'
import { Github } from 'lucide-react'
import Link from 'next/link'
import { BranchSelector } from './BranchSelector'

import { DocsButton } from 'components/ui/DocsButton'
import { DOCS_URL } from 'lib/constants'
import { Button } from 'ui'

const EMPTY_STATE_CONTAINER = 'flex items-center flex-col gap-0.5 justify-center w-full py-10 px-4'

export const PullRequestsEmptyState = ({
  url,
  projectRef,
  branches,
  onBranchSelected,
  isUpdating,
  githubConnection,
  gitlessBranching = false,
}: {
  url: string
  projectRef: string
  branches: Branch[]
  onBranchSelected: (branch: Branch) => void
  isUpdating: boolean
  githubConnection?: any
  gitlessBranching: boolean
}) => {
  return (
    <div className={EMPTY_STATE_CONTAINER}>
      <p>No merge requests</p>
      <p className="text-foreground-lighter text-center text-balance">
        Create your first merge request to merge changes back to the main branch
      </p>
      <div className="flex items-center space-x-2 mt-4">
        {githubConnection ? (
          <Button type="outline" asChild icon={<Github />}>
            <a href={url} target="_blank" rel="noopener noreferrer">
              Create pull request
            </a>
          </Button>
        ) : (
          <Button asChild type="outline">
            <Link href={`/project/${projectRef}/settings/integrations`}>Connect to GitHub</Link>
          </Button>
        )}
        {gitlessBranching && (
          <BranchSelector
            type="outline"
            branches={branches}
            onBranchSelected={onBranchSelected}
            isUpdating={isUpdating}
          />
        )}
      </div>
    </div>
  )
}

export const PreviewBranchesEmptyState = ({
  onSelectCreateBranch,
}: {
  onSelectCreateBranch: () => void
}) => {
  return (
    <div className={EMPTY_STATE_CONTAINER}>
      <p>Create your first preview branch</p>
      <p className="text-foreground-lighter text-center text-balance mb-4">
        Preview branches are short-lived environments that let you safely experiment with changes to
        your database schema without affecting your main database.
      </p>
      <div className="flex items-center space-x-2">
        <DocsButton href={`${DOCS_URL}/guides/platform/branching`} />
        <Button type="primary" onClick={() => onSelectCreateBranch()}>
          Create branch
        </Button>
      </div>
    </div>
  )
}
