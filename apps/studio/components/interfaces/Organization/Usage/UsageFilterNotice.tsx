import Link from 'next/link'
import { Admonition } from 'ui-patterns/Admonition'

import { ScaffoldContainer } from '@/components/layouts/Scaffold'

export interface UsageFilterNoticeProps {
  projectName: string
  branchName?: string
  hasBranches: boolean
}

export const UsageFilterNotice = ({
  projectName,
  branchName,
  hasBranches,
}: UsageFilterNoticeProps) => {
  return (
    <ScaffoldContainer className="mt-5">
      <Admonition
        type="default"
        title={branchName ? 'Usage filtered by branch' : 'Usage filtered by project'}
        description={
          <div className="space-y-2">
            <p>
              You are currently viewing usage for the{' '}
              <span className="font-medium text-foreground">{projectName}</span> project
              {!!branchName && (
                <>
                  , branch <span className="font-medium text-foreground">{branchName}</span>
                </>
              )}
              . Supabase uses{' '}
              <Link
                href="/docs/guides/platform/billing-on-supabase#organization-based-billing"
                target="_blank"
              >
                organization-level billing
              </Link>{' '}
              and quotas. For billing purposes, we sum up usage from all your projects. To view your
              usage quota, set the project filter above back to "All projects".
            </p>
            {!!branchName && (
              <p>
                This branch's usage counts toward the organization total, but is not included in the
                parent project's usage.
              </p>
            )}
            {!branchName && hasBranches && (
              <p>
                Each branch records its own usage, so this view excludes the project's branches.
                Select a branch above to see its usage. Usage from deleted branches still counts
                toward the organization total.
              </p>
            )}
          </div>
        }
      />
    </ScaffoldContainer>
  )
}
