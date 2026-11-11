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

// Body inlined from `components/layouts/AdvisorsLayout/AdvisorRulesLayout.tsx`
// minus its outer <DefaultLayout> wrap (already provided by the
// `routes/project/$ref.tsx` shell). The Next-side AdvisorRulesLayout
// keeps working unchanged for the pages router; we duplicate the
// PageLayout config here so the TanStack route can re-use the same
// title + nav + feature-preview badge without coupling to the
// component's DefaultLayout-wrapping shape.
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
