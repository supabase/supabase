import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { PropsWithChildren } from 'react'

import { DefaultLayout } from '../DefaultLayout'
import { IssuesLayout } from '../IssuesLayout/IssuesLayout'
import { PageLayout } from '../PageLayout/PageLayout'
import { useIsAdvisorRulesEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { FeaturePreviewBadge } from '@/components/ui/FeaturePreviewBadge'

export const AdvisorRulesLayout = ({ children }: PropsWithChildren<{}>) => {
  const { ref } = useParams()
  const isAdvisorRulesEnabled = useIsAdvisorRulesEnabled()
  return (
    <DefaultLayout>
      <IssuesLayout>
        <PageLayout
          title={
            <span className="flex items-center gap-x-4">
              Check settings
              {isAdvisorRulesEnabled && (
                <FeaturePreviewBadge featureKey={LOCAL_STORAGE_KEYS.UI_PREVIEW_ADVISOR_RULES} />
              )}
            </span>
          }
          subtitle="Turn off specific advisor checks or categories"
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
      </IssuesLayout>
    </DefaultLayout>
  )
}
