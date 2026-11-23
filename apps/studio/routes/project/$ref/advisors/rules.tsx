import { createFileRoute, Link, Outlet, useLocation } from '@tanstack/react-router'
import { LOCAL_STORAGE_KEYS, useFlag } from 'common'
import { NavMenu, NavMenuItem } from 'ui'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageNav } from 'ui-patterns/PageNav'

import { useIsAdvisorRulesEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { AdvisorsLayout } from '@/components/layouts/AdvisorsLayout/AdvisorsLayout'
import { IssuesLayout } from '@/components/layouts/IssuesLayout/IssuesLayout'
import { FeaturePreviewBadge } from '@/components/ui/FeaturePreviewBadge'

export const Route = createFileRoute('/project/$ref/advisors/rules')({
  component: AdvisorRulesShell,
  staticData: {
    skipAdvisorsLayout: true,
  },
})

function AdvisorRulesShell() {
  const { ref } = Route.useParams()
  const pathname = useLocation({ select: (location) => location.pathname })
  const isIssuesInboxEnabled = useFlag('issuesInbox')
  const Layout = isIssuesInboxEnabled ? IssuesLayout : AdvisorsLayout
  const isAdvisorRulesEnabled = useIsAdvisorRulesEnabled()

  return (
    <Layout>
      <PageHeader>
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>
              <span className="flex items-center gap-x-4">
                <span>{isIssuesInboxEnabled ? 'Check settings' : 'Advisor settings'}</span>
                {isAdvisorRulesEnabled && (
                  <FeaturePreviewBadge featureKey={LOCAL_STORAGE_KEYS.UI_PREVIEW_ADVISOR_RULES} />
                )}
              </span>
            </PageHeaderTitle>
            <PageHeaderDescription>
              {isIssuesInboxEnabled
                ? 'Turn off specific checks or categories'
                : 'Disable specific advisor categories or rules'}
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <PageNav size="default">
        <NavMenu>
          <NavMenuItem active={pathname === `/project/${ref}/advisors/rules/security`}>
            <Link to="/project/$ref/advisors/rules/security" params={{ ref }}>
              Security
            </Link>
          </NavMenuItem>
          <NavMenuItem active={pathname === `/project/${ref}/advisors/rules/performance`}>
            <Link to="/project/$ref/advisors/rules/performance" params={{ ref }}>
              Performance
            </Link>
          </NavMenuItem>
        </NavMenu>
      </PageNav>
      <Outlet />
    </Layout>
  )
}
