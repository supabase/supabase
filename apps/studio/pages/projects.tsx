import { useRouter } from 'next/router'
import { useEffect } from 'react'

import ProjectList from 'components/interfaces/Home/ProjectList'
import { AccountLayout } from 'components/layouts'
import OrganizationDropdown from 'components/to-be-cleaned/Dropdown/OrganizationDropdown'
import AlertError from 'components/ui/AlertError'
import Connecting from 'components/ui/Loading/Loading'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useAutoProjectsPrefetch } from 'data/projects/projects-query'
import { useFlag, useIsFeatureEnabled } from 'hooks'
import { IS_PLATFORM, LOCAL_STORAGE_KEYS } from 'lib/constants'
import { useProfile } from 'lib/profile'
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

  const projectCreationEnabled = useIsFeatureEnabled('projects:create')

  const { isLoading: isProfileLoading } = useProfile()
  const isLoading = isOrganizationLoading || isProfileLoading
  const navLayoutV2 = useFlag('navigationLayoutV2')
  const hasWindowLoaded = typeof window !== 'undefined'

  useEffect(() => {
    if (navLayoutV2 && isSuccess && hasWindowLoaded) {
      const localStorageSlug = localStorage.getItem(
        LOCAL_STORAGE_KEYS.RECENTLY_VISITED_ORGANIZATION
      )
      const verifiedSlug = organizations.some((org) => org.slug === localStorageSlug)

      if (organizations.length === 0) router.push('/new')
      else if (localStorageSlug && verifiedSlug) router.push(`/org/${localStorageSlug}`)
      else router.push(`/org/${organizations[0].slug}`)
    }
  }, [navLayoutV2, isSuccess, hasWindowLoaded])

  return (
    <>
      {(navLayoutV2 || isLoading) && (
        <div className={`flex items-center justify-center h-full`}>
          <Connecting />
        </div>
      )}

      {isError && (
        <div
          className={`py-4 px-5 ${navLayoutV2 ? 'h-full flex items-center justify-center' : ''}`}
        >
          <AlertError subject="Failed to retrieve organizations" />
        </div>
      )}

      {!navLayoutV2 && isSuccess && (
        <div className="py-4 px-5">
          {IS_PLATFORM && projectCreationEnabled && organizations.length !== 0 && (
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
