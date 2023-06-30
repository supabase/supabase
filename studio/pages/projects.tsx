import ProjectList from 'components/interfaces/Home/ProjectList'
import { AccountLayout } from 'components/layouts'
import OrganizationDropdown from 'components/to-be-cleaned/Dropdown/OrganizationDropdown'
import AlertError from 'components/ui/AlertError'
import Connecting from 'components/ui/Loading/Loading'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useAutoProjectsPrefetch } from 'data/projects/projects-query'
import { IS_PLATFORM } from 'lib/constants'
import { useProfile } from 'lib/profile'
import { NextPageWithLayout } from 'types'

const ProjectsPage: NextPageWithLayout = () => {
  const {
    data: organizations,
    isLoading: isOrganizationLoading,
    isError,
    isSuccess,
  } = useOrganizationsQuery()
  useAutoProjectsPrefetch()

  const { isLoading: isProfileLoading } = useProfile()

  const isLoading = isOrganizationLoading || isProfileLoading

  return (
    <>
      {isLoading && (
        <div className="flex h-full items-center justify-center space-x-2">
          <Connecting />
        </div>
      )}

      {isError && (
        <div className="py-4 px-5">
          <AlertError subject="Unable to retrieve organizations" />
        </div>
      )}

      {isSuccess && (
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
