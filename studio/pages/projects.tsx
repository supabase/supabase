import ProjectList from 'components/interfaces/Home/ProjectList'
import { AccountLayout } from 'components/layouts'
import OrganizationDropdown from 'components/to-be-cleaned/Dropdown/OrganizationDropdown'
import Connecting from 'components/ui/Loading/Loading'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useAutoProjectsPrefetch } from 'data/projects/projects-query'
import { IS_PLATFORM } from 'lib/constants'
import { NextPageWithLayout } from 'types'

const ProjectsPage: NextPageWithLayout = () => {
  const { data: organizations, isLoading: _isLoading } = useOrganizationsQuery()
  useAutoProjectsPrefetch()

  // We'll continue the loading state if there's no organizations
  // because we're waiting for the default organization to be created
  const isLoading = _isLoading || (organizations?.length ?? 0) <= 0

  return (
    <>
      {isLoading ? (
        <div className="flex h-full items-center justify-center space-x-2">
          <Connecting />
        </div>
      ) : (
        <div className="py-4 px-5">
          {IS_PLATFORM && (
            <div className="my-2">
              <div className="flex">
                <div className="">
                  <OrganizationDropdown organizations={organizations} />
                </div>
              </div>
            </div>
          )}
          <div className="my-8 space-y-8">
            <ProjectList />
          </div>
        </div>
      )}
    </>
  )
}

ProjectsPage.getLayout = (page) => (
  <AccountLayout
    title="Dashboard"
    breadcrumbs={[
      {
        key: `supabase-projects`,
        label: 'Projects',
      },
    ]}
  >
    {page}
  </AccountLayout>
)

export default ProjectsPage
