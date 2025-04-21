import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

import { useParams } from 'common'
import { useIsNewLayoutEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { LayoutUpdateBanner } from 'components/interfaces/App/FeaturePreview/LayoutUpdatePreview'
import { ProjectList } from 'components/interfaces/Home/ProjectList'
import HomePageActions from 'components/interfaces/HomePageActions'
import DefaultLayout from 'components/layouts/DefaultLayout'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import { ScaffoldContainerLegacy } from 'components/layouts/Scaffold'
import { useAutoProjectsPrefetch } from 'data/projects/projects-query'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { LOCAL_STORAGE_KEYS, PROJECT_STATUS } from 'lib/constants'
import type { NextPageWithLayout } from 'types'

const ProjectsPage: NextPageWithLayout = () => {
  const newLayoutPreview = useIsNewLayoutEnabled()
  const hasWindowLoaded = typeof window !== 'undefined'

  const router = useRouter()
  const { slug } = useParams()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string[]>([
    PROJECT_STATUS.ACTIVE_HEALTHY,
    PROJECT_STATUS.INACTIVE,
  ])

  const [newLayoutPreviewState] = useLocalStorageQuery(LOCAL_STORAGE_KEYS.UI_NEW_LAYOUT_PREVIEW, '')
  const [newLayoutAcknowledged, setNewLayoutAcknowledged] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.NEW_LAYOUT_NOTICE_ACKNOWLEDGED,
    false
  )
  const isDefaultOptedInNewLayout = newLayoutPreview && newLayoutPreviewState === ''

  useAutoProjectsPrefetch()

  useEffect(() => {
    // handle old layout redirect
    // this page should not be accessible in the old layout
    if (hasWindowLoaded && !newLayoutPreview && slug && router) {
      router.push(`/projects`)
    }
  }, [newLayoutPreview, router, slug])

  return (
    <ScaffoldContainerLegacy>
      <div>
        <LayoutUpdateBanner />

        <HomePageActions
          search={search}
          setSearch={setSearch}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
        />

        <div className="my-6 space-y-8">
          <ProjectList
            filterToSlug
            search={search}
            filterStatus={filterStatus}
            resetFilterStatus={() => setFilterStatus(['ACTIVE_HEALTHY', 'INACTIVE'])}
          />
        </div>
      </div>
    </ScaffoldContainerLegacy>
  )
}

ProjectsPage.getLayout = (page) => (
  <DefaultLayout>
    <OrganizationLayout>{page}</OrganizationLayout>
  </DefaultLayout>
)

export default ProjectsPage
