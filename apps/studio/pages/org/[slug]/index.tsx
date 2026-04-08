import { useIsMFAEnabled } from 'common'
import Link from 'next/link'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns'

import { ProjectList } from '@/components/interfaces/Home/ProjectList/ProjectList'
import { HomePageActions } from '@/components/interfaces/HomePageActions'
import DefaultLayout from '@/components/layouts/DefaultLayout'
import OrganizationLayout from '@/components/layouts/OrganizationLayout'
import { PageLayout } from '@/components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from '@/components/layouts/Scaffold'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import type { NextPageWithLayout } from '@/types'

const ProjectsPage: NextPageWithLayout = () => {
  const isUserMFAEnabled = useIsMFAEnabled()
  const { data: org } = useSelectedOrganizationQuery()

  const disableAccessMfa = org?.organization_requires_mfa && !isUserMFAEnabled

  return (
    <ScaffoldContainer className="flex-grow flex">
      <ScaffoldSection isFullWidth className="pb-0">
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
              <Button asChild type="default">
                <Link href="/account/security">Set up MFA</Link>
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-y-4">
            <HomePageActions />
            <ProjectList />
          </div>
        )}
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

ProjectsPage.getLayout = (page) => (
  <DefaultLayout>
    <OrganizationLayout title="Projects">
      <PageLayout title="Projects">{page}</PageLayout>
    </OrganizationLayout>
  </DefaultLayout>
)

export default ProjectsPage
