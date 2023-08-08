import { useIsNavigationPreviewEnabled } from 'components/interfaces/App/FeaturePreviewContext'
import ProjectList from 'components/interfaces/Home/ProjectList'
import { AccountLayout } from 'components/layouts'
import OrganizationDropdown from 'components/to-be-cleaned/Dropdown/OrganizationDropdown'
import AlertError from 'components/ui/AlertError'
import Connecting from 'components/ui/Loading/Loading'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useAutoProjectsPrefetch } from 'data/projects/projects-query'
import { useFlag, useLocalStorage } from 'hooks'
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
  const hasWindowLoaded = typeof window !== 'undefined'
  const isNavigationPreviewEnabled = useIsNavigationPreviewEnabled()

  useEffect(() => {
    if (isNavigationPreviewEnabled && isSuccess && hasWindowLoaded) {
      const localStorageSlug = localStorage.getItem(
        LOCAL_STORAGE_KEYS.RECENTLY_VISITED_ORGANIZATION
      )
      const verifiedSlug = organizations.some((org) => org.slug === localStorageSlug)

      if (organizations.length === 0) router.push('/new')
      else if (localStorageSlug && verifiedSlug) router.push(`/org/${localStorageSlug}`)
      else router.push(`/org/${organizations[0].slug}`)
    }
  }, [isNavigationPreviewEnabled, isSuccess, hasWindowLoaded])

  return (
    <>
      {isNavigationPreviewEnabled && isLoading && (
        <div className={`flex items-center justify-center h-full`}>
          <Connecting />
        </div>
      )}

      {isError && (
        <div
          className={`py-4 px-5 ${
            isNavigationPreviewEnabled ? 'h-full flex items-center justify-center' : ''
          }`}
        >
          <AlertError subject="Failed to retrieve organizations" />
        </div>
      )}

      {!isNavigationPreviewEnabled && isSuccess && (
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
