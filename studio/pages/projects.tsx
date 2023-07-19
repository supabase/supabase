import ProjectList from 'components/interfaces/Home/ProjectList'
import { AccountLayout } from 'components/layouts'
import OrganizationDropdown from 'components/to-be-cleaned/Dropdown/OrganizationDropdown'
import AlertError from 'components/ui/AlertError'
import Connecting from 'components/ui/Loading/Loading'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useAutoProjectsPrefetch } from 'data/projects/projects-query'
import { useFlag } from 'hooks'
import { IS_PLATFORM, LOCAL_STORAGE_KEYS } from 'lib/constants'
import { useProfile } from 'lib/profile'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { NextPageWithLayout } from 'types'

const ProjectsPage: NextPageWithLayout = () => {
  const router = useRouter()
  const {
    data: organizations,
    isLoading: isOrganizationLoading,
    isError,
    isSuccess,
  } = useOrganizationsQuery()
  useAutoProjectsPrefetch()

  const { isLoading: isProfileLoading } = useProfile()
  const isLoading = isOrganizationLoading || isProfileLoading
  const navLayoutV2 = useFlag('navigationLayoutV2')

  useEffect(() => {
    if (navLayoutV2 && isSuccess && typeof window !== 'undefined') {
      const localStorageSlug =
        typeof window !== 'undefined'
          ? localStorage.getItem(LOCAL_STORAGE_KEYS.RECENTLY_VISITED_ORGANIZATION)
          : undefined
      if (localStorageSlug) router.push(`/org/${localStorageSlug}`)
      else router.push(`/org/${organizations[0].slug}`)
    }
  }, [navLayoutV2, isSuccess, typeof window])

  return (
    <>
      {isLoading && (
        <div className="flex h-full items-center justify-center space-x-2">
          <Connecting />
        </div>
      )}

      {isError && (
        <div className="py-4 px-5">
          <AlertError subject="Failed to retrieve organizations" />
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
