import { OrganizationProjectsHomeContent } from 'components/interfaces/Organization/OrganizationProjectsHomeContent'
import DefaultLayout from 'components/layouts/DefaultLayout'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import type { NextPageWithLayout } from 'types'

const ProjectsPage: NextPageWithLayout = () => {
  return <OrganizationProjectsHomeContent />
}

ProjectsPage.getLayout = (page) => (
  <DefaultLayout>
    <OrganizationLayout title="Projects">
      <PageLayout title="Projects">{page}</PageLayout>
    </OrganizationLayout>
  </DefaultLayout>
)

export default ProjectsPage
