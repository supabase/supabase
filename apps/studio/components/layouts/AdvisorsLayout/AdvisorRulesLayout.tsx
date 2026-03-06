import { useParams } from 'common'
import { PropsWithChildren } from 'react'

import DefaultLayout from '../DefaultLayout'
import { PageLayout } from '../PageLayout/PageLayout'
import AdvisorsLayout from './AdvisorsLayout'

export const AdvisorRulesLayout = ({ children }: PropsWithChildren<{}>) => {
  const { ref } = useParams()
  return (
    <DefaultLayout>
      <AdvisorsLayout>
        <PageLayout
          title="Advisor Settings"
          subtitle="Disable specific advisor categories or rules"
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
