import { Admonition } from 'ui-patterns/Admonition'

import { InlineLinkClassName } from '@/components/ui/InlineLink'

export interface NoProjectsNoticeProps {
  appName: string
  organizationSlug: string
  onSwitchOrg: () => void
}

export const NoProjectsNotice = ({
  appName,
  organizationSlug,
  onSwitchOrg,
}: NoProjectsNoticeProps) => {
  return (
    <Admonition
      type="default"
      title={`No projects in ${organizationSlug}`}
      description={
        <>
          <p>
            {appName} needs access to at least one project, and this organization doesn't have any
            yet.
          </p>
          <p>
            Expecting to see your projects?{' '}
            <button
              type="button"
              tabIndex={0}
              className={InlineLinkClassName}
              onClick={onSwitchOrg}
            >
              Switch organization
            </button>
          </p>
        </>
      }
    />
  )
}
