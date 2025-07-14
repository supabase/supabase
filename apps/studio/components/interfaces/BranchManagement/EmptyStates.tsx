import { PermissionAction } from '@supabase/shared-types/out/constants'
import type { Branch } from 'data/branches/branches-query'
import { ExternalLink, GitBranch, Github } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { BranchSelector } from './BranchSelector'

import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useAppStateSnapshot } from 'state/app-state'
import { Button } from 'ui'

export const BranchingEmptyState = () => {
  const snap = useAppStateSnapshot()

  const canCreateBranches = useCheckPermissions(PermissionAction.CREATE, 'preview_branches', {
    resource: { is_default: false },
  })

  return (
    <ProductEmptyState title="Database Branching">
      <p className="text-sm text-light">
        Create preview branches to experiment with changes to your database schema in a safe,
        non-destructive environment.
      </p>
      <div className="flex items-center space-x-2 !mt-4">
        <ButtonTooltip
          disabled={!canCreateBranches}
          icon={<GitBranch strokeWidth={1.5} />}
          onClick={() => snap.setShowCreateBranchModal(true)}
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

        <Button type="default" icon={<ExternalLink strokeWidth={1.5} />} asChild>
          <a
            target="_blank"
            rel="noreferrer"
            href="https://supabase.com/docs/guides/platform/branching"
          >
            View the docs
          </a>
        </Button>
      </div>
    </ProductEmptyState>
  )
}

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
  const router = useRouter()
  return (
    <div className="flex items-center flex-col justify-center w-full py-10">
      <p>No merge requests</p>
      <p className="text-foreground-light">
        Create your first merge request to merge changes back to the main branch
      </p>
      <div className="flex items-center space-x-2 mt-4">
        {githubConnection ? (
          <Button type="outline" asChild icon={<Github />}>
            <Link passHref href={url} target="_blank" rel="noreferrer">
              Create pull request
            </Link>
          </Button>
        ) : (
          <Button
            type="outline"
            onClick={() => router.push(`/project/${projectRef}/settings/integrations`)}
          >
            Connect to GitHub
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
    <div className="flex items-center flex-col justify-center w-full py-10">
      <p>Create your first preview branch</p>
      <p className="text-foreground-light mb-4">
        Preview branches are used to experiment with changes to your database schema in a safe,
        non-destructive environment.
      </p>
      <div className="flex items-center space-x-2">
        <Button type="default" iconRight={<ExternalLink size={14} />}>
          <Link
            target="_blank"
            rel="noreferrer"
            href="https://supabase.com/docs/guides/platform/branching"
          >
            Docs
          </Link>
        </Button>
        <Button type="primary" onClick={() => onSelectCreateBranch()}>
          Create your first branch
        </Button>
      </div>
    </div>
  )
}
