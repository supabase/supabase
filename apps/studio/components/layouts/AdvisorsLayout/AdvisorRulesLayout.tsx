import { LOCAL_STORAGE_KEYS, useFlag, useParams } from 'common'
import { PropsWithChildren } from 'react'

import { DefaultLayout } from '../DefaultLayout'
import { IssuesLayout } from '../IssuesLayout/IssuesLayout'
import { PageLayout } from '../PageLayout/PageLayout'
import { useIsAdvisorRulesEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { AdvisorsLayout } from '@/components/layouts/AdvisorsLayout/AdvisorsLayout'
import { FeaturePreviewBadge } from '@/components/ui/FeaturePreviewBadge'

export const AdvisorRulesLayout = ({ children }: PropsWithChildren<{}>) => {
  const { ref } = useParams()
  const isIssuesInboxEnabled = useFlag('issuesInbox')
  const Layout = isIssuesInboxEnabled ? IssuesLayout : AdvisorsLayout
  const isAdvisorRulesEnabled = useIsAdvisorRulesEnabled()
  return (
    <DefaultLayout>
      <Layout>
        <PageLayout
          title={
            <span className="flex items-center gap-x-4">
              <span>{isIssuesInboxEnabled ? 'Check settings' : 'Advisor settings'}</span>
              {isAdvisorRulesEnabled && (
                <FeaturePreviewBadge featureKey={LOCAL_STORAGE_KEYS.UI_PREVIEW_ADVISOR_RULES} />
              )}
            </span>
          }
          subtitle={
            isIssuesInboxEnabled
              ? 'Turn off specific checks or categories'
              : 'Disable specific advisor categories or rules'
          }
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
      </Layout>
    </DefaultLayout>
  )
}
