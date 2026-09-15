import { Admonition } from 'ui-patterns/Admonition'

import { CONSENT_COPY } from './OAuthAppsAuthorizeScreen.utils'
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
      title={CONSENT_COPY.noProjects.title(organizationSlug)}
      description={
        <>
          <p>{CONSENT_COPY.noProjects.body(appName)}</p>
          <p>
            {CONSENT_COPY.noProjects.prompt}{' '}
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
