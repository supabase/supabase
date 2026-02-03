import { IS_PLATFORM } from 'common'
import { Home } from 'components/interfaces/Home/Home'
import { HomeV2 } from 'components/interfaces/HomeNew/Home'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout'
import { useTrackExperimentExposure } from 'hooks/misc/useTrackExperimentExposure'
import { usePHFlag } from 'hooks/ui/useFlag'
import type { NextPageWithLayout } from 'types'

const HomePage: NextPageWithLayout = () => {
  const homeNewVariant = usePHFlag<string>('homeNew')
  const isHomeNew = homeNewVariant === 'new-home'

  useTrackExperimentExposure('home_new', IS_PLATFORM ? homeNewVariant : undefined)

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
