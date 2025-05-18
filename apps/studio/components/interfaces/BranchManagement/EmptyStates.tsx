import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ExternalLink, GitBranch, GitPullRequest } from 'lucide-react'
import Link from 'next/link'

import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useAppStateSnapshot } from 'state/app-state'
import { Button } from 'ui'

export const BranchingEmptyState = () => {
  const snap = useAppStateSnapshot()

  const canEnableBranching = useCheckPermissions(PermissionAction.CREATE, 'preview_branches', {
    resource: { is_default: true },
  })

  return (
    <ProductEmptyState title="Database Branching">
      <p className="text-sm text-light">
        Create preview branches to experiment changes to your database schema in a safe,
        non-destructible environment.
      </p>
      <div className="flex items-center space-x-2 !mt-4">
        <ButtonTooltip
          disabled={!canEnableBranching}
          icon={<GitBranch strokeWidth={1.5} />}
          onClick={() => snap.setShowEnableBranchingModal(true)}
          tooltip={{
            content: {
              side: 'bottom',
              text: !canEnableBranching
                ? 'You need additional permissions to enable branching'
                : undefined,
            },
          }}
        >
          Enable branching
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
  hasBranches,
}: {
  url: string
  hasBranches: boolean
}) => {
  return (
    <div className="flex items-center flex-col justify-center w-full py-10">
      <p>No pull requests made yet for this repository</p>
      <p className="text-foreground-light">
        Only pull requests with the ./migration directory changes will show here.
      </p>
      {hasBranches && (
        <div className="w-96 border rounded-md mt-4">
          <div className="px-5 py-3 bg-surface-100 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <GitPullRequest size={18} strokeWidth={2} className="text-foreground-light" />
              <p>Create a pull request</p>
            </div>
            <Button asChild type="default" iconRight={<ExternalLink size={14} />}>
              <Link passHref target="_blank" rel="noreferrer" href={url}>
                Github
              </Link>
            </Button>
          </div>
          <div className="px-5 py-3 border-t flex items-center justify-between">
            <div>
              <p>Not sure what to do?</p>
              <p className="text-foreground-light">Browse our documentation</p>
            </div>
            <Button type="default" iconRight={<ExternalLink size={14} />}>
              <Link
                target="_blank"
                rel="noreferrer"
                href="https://supabase.com/docs/guides/platform/branching"
              >
                Docs
              </Link>
            </Button>
          </div>
        </div>
      )}
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
      <p>No database preview branches</p>
      <p className="text-foreground-light">Database preview branches will be shown here</p>
      <div className="w-[500px] border rounded-md mt-4">
        <div className="px-5 py-3 bg-surface-100 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <GitBranch strokeWidth={2} className="text-foreground-light" />
            <div>
              <p>Create a preview branch</p>
              <p className="text-foreground-light">Start developing in preview</p>
            </div>
          </div>
          <Button type="default" onClick={() => onSelectCreateBranch()}>
            Create preview branch
          </Button>
        </div>
        <div className="px-5 py-3 border-t flex items-center justify-between">
          <div>
            <p>Not sure what to do?</p>
            <p className="text-foreground-light">Browse our documentation</p>
          </div>
          <Button type="default" iconRight={<ExternalLink size={14} />}>
            <Link
              target="_blank"
              rel="noreferrer"
              href="https://supabase.com/docs/guides/platform/branching"
            >
              Docs
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
