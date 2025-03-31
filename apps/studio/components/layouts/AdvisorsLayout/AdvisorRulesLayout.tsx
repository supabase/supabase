import { PropsWithChildren } from 'react'

import { useParams } from 'common'
import DefaultLayout from '../DefaultLayout'
import { PageLayout } from '../PageLayout/PageLayout'
import AdvisorsLayout from './AdvisorsLayout'

export const AdvisorRulesLayout = ({ children }: PropsWithChildren<{}>) => {
  const { ref } = useParams()
  return (
    <DefaultLayout>
      <AdvisorsLayout>
        <PageLayout
          title="Advisor Rules"
          subtitle="Disable specific advisor categories or rules, or assign them to members for resolution"
          navigationItems={[
            {
              label: 'Security',
              href: `/project/${ref}/advisors/rules/security`,
            },
            {
              label: 'Performance',
              href: `/project/${ref}/advisors/rules/performance`,
            },
          ]}
        >
          {children}
        </PageLayout>
      </AdvisorsLayout>
    </DefaultLayout>
  )
}
