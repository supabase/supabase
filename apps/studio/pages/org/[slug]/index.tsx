import { useIsMFAEnabled } from 'common'
import { ProjectList } from 'components/interfaces/Home/ProjectList/ProjectList'
import { HomePageActions } from 'components/interfaces/HomePageActions'
import DefaultLayout from 'components/layouts/DefaultLayout'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { InlineLink } from 'components/ui/InlineLink'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import type { NextPageWithLayout } from 'types'
import { Admonition } from 'ui-patterns'

const ProjectsPage: NextPageWithLayout = () => {
  const isUserMFAEnabled = useIsMFAEnabled()
  const { data: org } = useSelectedOrganizationQuery()

  const disableAccessMfa = org?.organization_requires_mfa && !isUserMFAEnabled

  return (
    <ScaffoldContainer className="flex-grow flex">
      <ScaffoldSection isFullWidth className="flex-grow pb-0">
        {disableAccessMfa ? (
          <Admonition type="note" title={`The organization "${org?.name}" has MFA enforced`}>
            <p className="!m-0">
              Set up MFA on your account through your{' '}
              <InlineLink href="/account/security">account preferences</InlineLink> to access this
              organization
            </p>
          </Admonition>
        ) : (
          // [Joshen] Very odd, but the h-px here is required for ProjectList to have a max
          // height based on the remaining space that it can grow to
          <div className="flex flex-col gap-y-4 flex-grow h-px">
            <HomePageActions showViewToggle={true} />
            <ProjectList />
          </div>
        )}
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

ProjectsPage.getLayout = (page) => (
  <DefaultLayout>
    <OrganizationLayout>
      <PageLayout title="Projects">{page}</PageLayout>
    </OrganizationLayout>
  </DefaultLayout>
)

export default ProjectsPage
