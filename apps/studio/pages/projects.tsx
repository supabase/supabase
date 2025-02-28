import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

import { ProjectList } from 'components/interfaces/Home/ProjectList'
import HomePageActions from 'components/interfaces/HomePageActions'

import AlertError from 'components/ui/AlertError'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useAutoProjectsPrefetch } from 'data/projects/projects-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { IS_PLATFORM, LOCAL_STORAGE_KEYS, PROJECT_STATUS } from 'lib/constants'
import type { NextPageWithLayout } from 'types'
import AccountLayout from 'components/layouts/AccountLayout/AccountLayout'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { cn } from 'ui'
import { MAX_WIDTH_CLASSES, PADDING_CLASSES } from 'components/layouts/Scaffold'
import { useNewLayout } from 'hooks/ui/useNewLayout'

const ProjectsPage: NextPageWithLayout = () => {
  const newLayoutPreview = useNewLayout()

  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string[]>([
    PROJECT_STATUS.ACTIVE_HEALTHY,
    PROJECT_STATUS.INACTIVE,
  ])

  const { data: organizations, isError, isSuccess } = useOrganizationsQuery()
  useAutoProjectsPrefetch()

  const projectCreationEnabled = useIsFeatureEnabled('projects:create')
  const hasWindowLoaded = typeof window !== 'undefined'

  useEffect(() => {
    if (isSuccess && hasWindowLoaded) {
      const hasNoOrg = organizations.length === 0
      const hasShownNewPage = localStorage.getItem(LOCAL_STORAGE_KEYS.UI_ONBOARDING_NEW_PAGE_SHOWN)
      if (hasNoOrg && !hasShownNewPage) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.UI_ONBOARDING_NEW_PAGE_SHOWN, 'true')
        router.push('/new')
      }
    }
  }, [isSuccess, hasWindowLoaded])

  return (
    <div className={cn(newLayoutPreview && [MAX_WIDTH_CLASSES, PADDING_CLASSES])}>
      {isError && (
        <div className="p-4 md:px-5">
          <AlertError subject="Failed to retrieve organizations" />
        </div>
      )}

      <div className="p-4 md:p-5">
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
    </div>
  )
}

ProjectsPage.getLayout = (page) => (
  <DefaultLayout headerTitle="All Projects">
    <OrganizationLayout>{page}</OrganizationLayout>
  </DefaultLayout>
)

export default ProjectsPage
