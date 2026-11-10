import { createFileRoute, Outlet } from '@tanstack/react-router'
import { LOCAL_STORAGE_KEYS, useParams } from 'common'

import { useIsAdvisorRulesEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import AdvisorsLayout from '@/components/layouts/AdvisorsLayout/AdvisorsLayout'
import { PageLayout } from '@/components/layouts/PageLayout/PageLayout'
import { FeaturePreviewBadge } from '@/components/ui/FeaturePreviewBadge'

export const Route = createFileRoute('/project/$ref/advisors/rules')({
  component: AdvisorRulesShell,
  // Opt out of the parent advisors.tsx shell's <AdvisorsLayout> wrap
  // — we render our own with no title, plus a PageLayout tab strip.
  staticData: {
    skipAdvisorsLayout: true,
  },
})

function AdvisorRulesShell() {
  const { ref } = useParams()
  const isAdvisorRulesEnabled = useIsAdvisorRulesEnabled()

  return (
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
        <Outlet />
      </PageLayout>
    </AdvisorsLayout>
  )
}
