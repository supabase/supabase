import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { PropsWithChildren } from 'react'

import DefaultLayout from '../DefaultLayout'
import { PageLayout } from '../PageLayout/PageLayout'
import AdvisorsLayout from './AdvisorsLayout'
import { useIsAdvisorRulesEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { FeaturePreviewBadge } from '@/components/ui/FeaturePreviewBadge'

export const AdvisorRulesLayout = ({ children }: PropsWithChildren<{}>) => {
  const { ref } = useParams()
  const isAdvisorRulesEnabled = useIsAdvisorRulesEnabled()
  return (
    <DefaultLayout>
      <AdvisorsLayout>
        <PageLayout
          title={
            <span className="flex items-center gap-x-4">
              Advisor Settings
              {isAdvisorRulesEnabled && (
                <FeaturePreviewBadge featureKey={LOCAL_STORAGE_KEYS.UI_PREVIEW_ADVISOR_RULES} />
              )}
            </span>
          }
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
