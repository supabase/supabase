import { createFileRoute, Outlet } from '@tanstack/react-router'
import { LOCAL_STORAGE_KEYS, useFlag, useParams } from 'common'

import { useIsAdvisorRulesEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { AdvisorsLayout } from '@/components/layouts/AdvisorsLayout/AdvisorsLayout'
import { IssuesLayout } from '@/components/layouts/IssuesLayout/IssuesLayout'
import { PageLayout } from '@/components/layouts/PageLayout/PageLayout'
import { FeaturePreviewBadge } from '@/components/ui/FeaturePreviewBadge'

export const Route = createFileRoute('/project/$ref/advisors/rules')({
  component: AdvisorRulesShell,
  staticData: {
    skipAdvisorsLayout: true,
  },
})

function AdvisorRulesShell() {
  const { ref } = useParams()
  const isIssuesInboxEnabled = useFlag('issuesInbox')
  const Layout = isIssuesInboxEnabled ? IssuesLayout : AdvisorsLayout
  const isAdvisorRulesEnabled = useIsAdvisorRulesEnabled()

  return (
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
        <Outlet />
      </PageLayout>
    </Layout>
  )
}
