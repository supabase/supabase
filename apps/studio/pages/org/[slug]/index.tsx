import { useState } from 'react'

import { ProjectList } from 'components/interfaces/Home/ProjectList'
import HomePageActions from 'components/interfaces/HomePageActions'
import DefaultLayout from 'components/layouts/DefaultLayout'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import { ScaffoldContainerLegacy } from 'components/layouts/Scaffold'
import { useAutoProjectsPrefetch } from 'data/projects/projects-query'
import { PROJECT_STATUS } from 'lib/constants'
import type { NextPageWithLayout } from 'types'

const ProjectsPage: NextPageWithLayout = () => {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string[]>([
    PROJECT_STATUS.ACTIVE_HEALTHY,
    PROJECT_STATUS.INACTIVE,
  ])

  useAutoProjectsPrefetch()

  return (
    <ScaffoldContainerLegacy>
      <div>
        <HomePageActions
          search={search}
          setSearch={setSearch}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
        />

        <div className="my-6 space-y-8">
          <ProjectList
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
