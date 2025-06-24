import { useState } from 'react'

import { useIsMFAEnabled } from 'common'
import { ProjectList } from 'components/interfaces/Home/ProjectList'
import HomePageActions from 'components/interfaces/HomePageActions'
import DefaultLayout from 'components/layouts/DefaultLayout'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import { ScaffoldContainerLegacy } from 'components/layouts/Scaffold'
import { InlineLink } from 'components/ui/InlineLink'
import { useAutoProjectsPrefetch } from 'data/projects/projects-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { PROJECT_STATUS } from 'lib/constants'
import type { NextPageWithLayout } from 'types'
import { Admonition } from 'ui-patterns'

const ProjectsPage: NextPageWithLayout = () => {
  const org = useSelectedOrganization()
  const isUserMFAEnabled = useIsMFAEnabled()
  const disableAccessMfa = org?.organization_requires_mfa && !isUserMFAEnabled

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string[]>([
    PROJECT_STATUS.ACTIVE_HEALTHY,
    PROJECT_STATUS.INACTIVE,
  ])

  useAutoProjectsPrefetch()

  return (
    <ScaffoldContainerLegacy>
      {disableAccessMfa ? (
        <Admonition type="note" title={`The organization "${org?.name}" has MFA enforced`}>
          <p className="!m-0">
            Set up MFA on your account through your{' '}
            <InlineLink href="/account/security">account preferences</InlineLink> to access this
            organization
          </p>
        </Admonition>
      ) : (
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
      )}
    </ScaffoldContainerLegacy>
  )
}

ProjectsPage.getLayout = (page) => (
  <DefaultLayout>
    <OrganizationLayout>{page}</OrganizationLayout>
  </DefaultLayout>
)

export default ProjectsPage
