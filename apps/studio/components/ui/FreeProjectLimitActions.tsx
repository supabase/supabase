import { InlineLink } from '@/components/ui/InlineLink'
import { DOCS_URL } from '@/lib/constants'

interface FreeProjectLimitActionsProps {
  /** Completes "To …, you can:", e.g. "downgrade to the Free Plan" */
  goal: string
  hasMultipleMembers: boolean
}

export const FreeProjectLimitActions = ({
  goal,
  hasMultipleMembers,
}: FreeProjectLimitActionsProps) => {
  return (
    <>
      <p className="text-sm text-foreground-light">{`To ${goal}, you can:`}</p>
      <ol className="pl-5 text-sm list-decimal text-foreground-light space-y-1">
        <li>Upgrade one of the affected organizations to a paid plan.</li>
        <li>Delete or pause any of the active Free Plan projects.</li>
        <li>
          <InlineLink href={`${DOCS_URL}/guides/platform/project-transfer`}>
            Transfer a project
          </InlineLink>{' '}
          to a Free Plan organization and{' '}
          <InlineLink href={`${DOCS_URL}/guides/platform/free-project-pausing`}>
            pause it
          </InlineLink>
          .
        </li>
        {hasMultipleMembers && (
          <li>
            Demote the member to the Developer role through your{' '}
            <InlineLink href="/org/_/team">organization's Team settings</InlineLink> so their
            projects no longer count toward the Free Plan limit.
          </li>
        )}
      </ol>
    </>
  )
}
