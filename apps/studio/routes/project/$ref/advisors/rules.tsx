import { createFileRoute, Outlet } from '@tanstack/react-router'
import { LOCAL_STORAGE_KEYS, useParams } from 'common'

import { useIsAdvisorRulesEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { IssuesLayout } from '@/components/layouts/IssuesLayout/IssuesLayout'
import { PageLayout } from '@/components/layouts/PageLayout/PageLayout'
import { FeaturePreviewBadge } from '@/components/ui/FeaturePreviewBadge'

export const Route = createFileRoute('/project/$ref/advisors/rules')({
  component: AdvisorRulesShell,
  // Opt out of the parent advisors.tsx shell's <IssuesLayout> wrap
  // — we render our own with no title, plus a PageLayout tab strip,
  // mirroring the existing AdvisorRulesLayout component.
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
  const isAdvisorRulesEnabled = useIsAdvisorRulesEnabled()

  return (
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
        <Outlet />
      </PageLayout>
    </IssuesLayout>
  )
}
