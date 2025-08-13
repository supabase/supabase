import { PropsWithChildren } from 'react'

import { useParams } from 'common'
import DefaultLayout from '../DefaultLayout'
import { PageLayout } from '../PageLayout/PageLayout'
import AdvisorsLayout from './AdvisorsLayout'

export const AdvisorRulesLayout = ({ children }: PropsWithChildren<{}>) => {
  const { ref, slug } = useParams()
  return (
    <DefaultLayout>
      <AdvisorsLayout>
        <PageLayout
          title="Advisor Settings"
          subtitle="Disable specific advisor categories or rules"
          navigationItems={[
            {
              label: 'Security',
              href: `/org/${slug}/project/${ref}/advisors/rules/security`,
            },
            {
              label: 'Performance',
              href: `/org/${slug}/project/${ref}/advisors/rules/performance`,
            },
          ]}
        >
          {children}
        </PageLayout>
      </AdvisorsLayout>
    </DefaultLayout>
  )
}
