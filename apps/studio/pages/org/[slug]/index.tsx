import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

import { useParams } from 'common'
import { useNewLayout } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { ProjectList } from 'components/interfaces/Home/ProjectList'
import DefaultLayout from 'components/layouts/DefaultLayout'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import { ScaffoldContainerLegacy } from 'components/layouts/Scaffold'
import { useAutoProjectsPrefetch } from 'data/projects/projects-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { IS_PLATFORM, PROJECT_STATUS } from 'lib/constants'
import type { NextPageWithLayout } from 'types'
import { Button } from 'ui'

const ProjectsPage: NextPageWithLayout = () => {
  const newLayoutPreview = useNewLayout()

  const router = useRouter()
  const { slug } = useParams()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string[]>([
    PROJECT_STATUS.ACTIVE_HEALTHY,
    PROJECT_STATUS.INACTIVE,
  ])

  useAutoProjectsPrefetch()

  const projectCreationEnabled = useIsFeatureEnabled('projects:create')
  const hasWindowLoaded = typeof window !== 'undefined'

  useEffect(() => {
    // handle old layout redirect
    // this page should not be accessible in the old layout
    if (!newLayoutPreview && slug && router) {
      router.push(`/org/${slug}/general`)
    }
  }, [newLayoutPreview, router, slug])

  return (
    <ScaffoldContainerLegacy>
      <div>
        {IS_PLATFORM && projectCreationEnabled && (
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
  <DefaultLayout>
    <OrganizationLayout>{page}</OrganizationLayout>
  </DefaultLayout>
)

export default ProjectsPage
