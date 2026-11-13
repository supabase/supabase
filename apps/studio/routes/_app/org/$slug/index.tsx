import { createFileRoute, Link } from '@tanstack/react-router'
import { useIsMFAEnabled } from 'common'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { ProjectList } from '@/components/interfaces/Home/ProjectList/ProjectList'
import { HomePageActions } from '@/components/interfaces/HomePageActions'
import { PlanUsageCard } from '@/components/interfaces/ProjectHome/PlanUsageCard'
import { PageLayout } from '@/components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from '@/components/layouts/Scaffold'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useShowUpgradeCta } from '@/hooks/misc/useShowUpgradeCta'

export const Route = createFileRoute('/_app/org/$slug/')({
  component: OrgSlugIndex,
  staticData: {
    orgLayoutTitle: 'Projects',
  },
})

function OrgSlugIndex() {
  return (
    <PageLayout title="Projects">
      <ProjectsPage />
    </PageLayout>
  )
}

function ProjectsPage() {
  const isUserMFAEnabled = useIsMFAEnabled()
  const { data: org } = useSelectedOrganizationQuery()
  const { showUpgradeCta: showOrgProjectsListUsageCard } = useShowUpgradeCta()

  const disableAccessMfa = org?.organization_requires_mfa && !isUserMFAEnabled

  return (
    <ScaffoldContainer className="grow flex">
      <ScaffoldSection isFullWidth className="pb-12">
        {disableAccessMfa ? (
          <Admonition
            type="note"
            layout="horizontal"
            title={`${org?.name} requires MFA`}
            description={
              <>
                Set up multi-factor authentication (MFA) on your account to access this
                organization’s projects.
              </>
            }
            actions={
              <Button asChild>
                <Link to="/account/security">Set up MFA</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-5">
            <div className="flex flex-col gap-y-4 xl:flex-row xl:gap-x-6">
              <div className="flex flex-col gap-y-4 flex-1 min-w-0">
                <HomePageActions />
                <ProjectList />
              </div>
              {showOrgProjectsListUsageCard && (
                <aside className="xl:w-80 xl:shrink-0">
                  <ul className="list-none p-0 m-0">
                    <PlanUsageCard />
                  </ul>
                </aside>
              )}
            </div>
          </div>
        )}
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}
