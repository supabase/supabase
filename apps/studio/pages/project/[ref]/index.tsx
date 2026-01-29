import { useEffect, useRef } from 'react'

import { IS_PLATFORM } from 'common'
import { Home } from 'components/interfaces/Home/Home'
import { HomeV2 } from 'components/interfaces/HomeNew/Home'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { usePHFlag } from 'hooks/ui/useFlag'
import type { NextPageWithLayout } from 'types'

const HomePage: NextPageWithLayout = () => {
  const homeNewVariant = usePHFlag<string>('homeNew')
  const isHomeNew = homeNewVariant === 'new-home'
  const { mutate: sendEvent } = useSendEventMutation()
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()
  const hasTrackedExposure = useRef(false)

  useEffect(() => {
    if (!IS_PLATFORM) return
    if (hasTrackedExposure.current) return
    if (!homeNewVariant) return
    if (!project?.ref || !organization?.slug) return

    hasTrackedExposure.current = true

    sendEvent({
      action: 'home_new_experiment_exposed',
      properties: {
        variant: homeNewVariant,
      },
      groups: {
        project: project.ref,
        organization: organization.slug,
      },
    })
  }, [homeNewVariant, project?.ref, organization?.slug, sendEvent])

  if (isHomeNew) {
    return <HomeV2 />
  }
  return <Home />
}

HomePage.getLayout = (page) => (
  <DefaultLayout>
    <ProjectLayoutWithAuth>{page}</ProjectLayoutWithAuth>
  </DefaultLayout>
)

export default HomePage
