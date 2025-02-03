import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

import { ProjectList } from 'components/interfaces/Home/ProjectList'
import HomePageActions from 'components/interfaces/HomePageActions'
import AccountLayout from 'components/layouts/AccountLayout/account-layout'
import AlertError from 'components/ui/AlertError'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useAutoProjectsPrefetch } from 'data/projects/projects-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { IS_PLATFORM, LOCAL_STORAGE_KEYS, PROJECT_STATUS } from 'lib/constants'
import type { NextPageWithLayout } from 'types'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import { ScaffoldContainerLegacy } from 'components/layouts/Scaffold'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useParams } from 'common'
import { Button } from 'ui'
import Link from 'next/link'

const ProjectsPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { slug } = useParams()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string[]>([
    PROJECT_STATUS.ACTIVE_HEALTHY,
    PROJECT_STATUS.INACTIVE,
  ])

  // const { data: organizations, isError, isSuccess } = useOrganizationsQuery()

  useAutoProjectsPrefetch()

  const projectCreationEnabled = useIsFeatureEnabled('projects:create')
  const hasWindowLoaded = typeof window !== 'undefined'

  // useEffect(() => {
  //   if (isSuccess && hasWindowLoaded) {
  //     const hasNoOrg = organizations.length === 0
  //     const hasShownNewPage = localStorage.getItem(LOCAL_STORAGE_KEYS.UI_ONBOARDING_NEW_PAGE_SHOWN)
  //     if (hasNoOrg && !hasShownNewPage) {
  //       localStorage.setItem(LOCAL_STORAGE_KEYS.UI_ONBOARDING_NEW_PAGE_SHOWN, 'true')
  //       router.push('/new')
  //     }
  //   }
  // }, [isSuccess, hasWindowLoaded])

  return (
    <ScaffoldContainerLegacy>
      {/* {isError && (
        <div className="py-4">
          <AlertError subject="Failed to retrieve organizations" />
        </div>
      )} */}

      <div>
        {IS_PLATFORM && projectCreationEnabled && (
          // <HomePageActions
          //   search={search}
          //   filterStatus={filterStatus}
          //   setSearch={setSearch}
          //   setFilterStatus={setFilterStatus}
          //   organizations={organizations}
          // />
          <Link href={`/new/${slug}`}>
            <Button type="primary">New project</Button>
          </Link>
        )}
        <div className="my-6 space-y-8">
          <ProjectList
            search={search}
            filterStatus={filterStatus}
            resetFilterStatus={() => setFilterStatus(['ACTIVE_HEALTHY', 'INACTIVE'])}
            filterToSlug
          />
        </div>
      </div>
    </ScaffoldContainerLegacy>
  )
}

ProjectsPage.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout>
      <OrganizationLayout>{page}</OrganizationLayout>
    </DefaultLayout>
  </AppLayout>
)

export default ProjectsPage
