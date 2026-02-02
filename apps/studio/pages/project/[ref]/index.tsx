import { useEffect, useRef } from 'react'

import { IS_PLATFORM } from 'common'
import { Home } from 'components/interfaces/Home/Home'
import { HomeV2 } from 'components/interfaces/HomeNew/Home'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout'
import { usePHFlag } from 'hooks/ui/useFlag'
import { useTrack } from 'lib/telemetry/track'
import type { NextPageWithLayout } from 'types'

const HomePage: NextPageWithLayout = () => {
  const homeNewVariant = usePHFlag<string>('homeNew')
  const isHomeNew = homeNewVariant === 'new-home'
  const track = useTrack()
  const hasTrackedExposure = useRef(false)

  useEffect(() => {
    if (!IS_PLATFORM) return
    if (hasTrackedExposure.current) return
    if (!homeNewVariant) return

    hasTrackedExposure.current = true

    track('home_new_experiment_exposed', { variant: homeNewVariant })
  }, [homeNewVariant, track])

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
