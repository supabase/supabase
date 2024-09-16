import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

import { ProjectList } from 'components/interfaces/Home/ProjectList'
import HomePageActions from 'components/interfaces/HomePageActions'
import AccountLayout from 'components/layouts/AccountLayout/AccountLayout'
import AlertError from 'components/ui/AlertError'
import { Loading } from 'components/ui/Loading'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useAutoProjectsPrefetch } from 'data/projects/projects-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useFlag } from 'hooks/ui/useFlag'
import { IS_PLATFORM, LOCAL_STORAGE_KEYS, PROJECT_STATUS } from 'lib/constants'
import type { NextPageWithLayout } from 'types'

const ProjectsPage: NextPageWithLayout = () => {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string[]>([
    PROJECT_STATUS.ACTIVE_HEALTHY,
    PROJECT_STATUS.INACTIVE,
  ])
  const { data: organizations, isError, isSuccess } = useOrganizationsQuery()
  useAutoProjectsPrefetch()

  const projectCreationEnabled = useIsFeatureEnabled('projects:create')

  const navLayoutV2 = useFlag('navigationLayoutV2')
  const orgCreationExperimentGroup = useFlag<string>('orgCreationExperimentGroup')
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

    if (orgCreationExperimentGroup === 'group-b' && !navLayoutV2 && isSuccess && hasWindowLoaded) {
      // navigate to new page exactly once
      const hasNoOrg = organizations.length === 0
      const hasShownNewPage = localStorage.getItem(LOCAL_STORAGE_KEYS.UI_ONBOARDING_NEW_PAGE_SHOWN)
      if (hasNoOrg && !hasShownNewPage) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.UI_ONBOARDING_NEW_PAGE_SHOWN, 'true')
        router.push('/new')
      }
    }
  }, [navLayoutV2, isSuccess, hasWindowLoaded])

  return (
    <>
      {isError && (
        <div
          className={`py-4 px-5 ${navLayoutV2 ? 'h-full flex items-center justify-center' : ''}`}
        >
          <AlertError subject="Failed to retrieve organizations" />
        </div>
      )}

      {navLayoutV2 && (
        <div className={`flex items-center justify-center h-full`}>
          <Loading />
        </div>
      )}
      {!navLayoutV2 && (
        <div className="p-5">
          {IS_PLATFORM && projectCreationEnabled && isSuccess && (
            <HomePageActions
              search={search}
              filterStatus={filterStatus}
              setSearch={setSearch}
              setFilterStatus={setFilterStatus}
              organizations={organizations}
            />
          )}
          <div className="my-6 space-y-8">
            <ProjectList
              search={search}
              filterStatus={filterStatus}
              resetFilterStatus={() => setFilterStatus(['ACTIVE_HEALTHY', 'INACTIVE'])}
            />
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
