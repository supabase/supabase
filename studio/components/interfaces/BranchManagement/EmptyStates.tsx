import Link from 'next/link'
import { Button, IconExternalLink, IconGitBranch, IconGitPullRequest } from 'ui'

import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import { useSelectedOrganization } from 'hooks'
import { OPT_IN_TAGS } from 'lib/constants'
import { useAppStateSnapshot } from 'state/app-state'

export const BranchingEmptyState = () => {
  const selectedOrg = useSelectedOrganization()
  const snap = useAppStateSnapshot()

  const hasAccessToBranching =
    selectedOrg?.opt_in_tags?.includes(OPT_IN_TAGS.PREVIEW_BRANCHES) ?? false

  return (
    <ProductEmptyState title="Database Branching">
      <p className="text-sm text-light">
        {hasAccessToBranching
          ? 'Create preview branches to experiment changes to your database schema in a safe, non-destructible environment.'
          : "Register for early access and you'll be contacted by email when your organization is enrolled in database branching."}
      </p>
      {hasAccessToBranching ? (
        <div className="!mt-4">
          <Button
            icon={<IconGitBranch strokeWidth={1.5} />}
            onClick={() => snap.setShowEnableBranchingModal(true)}
          >
            Enable branching
          </Button>
        </div>
      ) : (
        <div className="flex items-center space-x-2 !mt-4">
          <Button asChild>
            <Link
              passHref
              rel="noreferrer"
              target="_blank"
              href="https://forms.supabase.com/branching-request"
            >
              Join waitlist
            </Link>
          </Button>
        </div>
      )}
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
              <IconGitPullRequest strokeWidth={2} className="text-foreground-light" />
              <p>Create a pull request</p>
            </div>
            <Button asChild type="default" iconRight={<IconExternalLink />}>
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
            <Button type="default" iconRight={<IconExternalLink />}>
              Docs
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
            <IconGitBranch strokeWidth={2} className="text-foreground-light" />
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
          <Button type="default" iconRight={<IconExternalLink />}>
            Docs
          </Button>
        </div>
      </div>
    </div>
  )
}
