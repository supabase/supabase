import { useFlag } from 'common'
import { PropsWithChildren } from 'react'

import { AdvisorsLayout } from './AdvisorsLayout'

export const LegacyAdvisorsLayout = ({ children }: PropsWithChildren) => {
  const isIssuesInboxEnabled = useFlag('issuesInbox')
  return isIssuesInboxEnabled ? <>{children}</> : <AdvisorsLayout>{children}</AdvisorsLayout>
}
