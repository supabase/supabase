import { Home } from 'components/interfaces/Home/Home'
import { HomeV2 } from 'components/interfaces/HomeNew/Home'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout'
import { usePHFlag } from 'hooks/ui/useFlag'
import { isHomeNewVariant, type HomeNewFlagValue } from 'lib/featureFlags/homeNew'
import type { NextPageWithLayout } from 'types'

const HomePage: NextPageWithLayout = () => {
  const homeNewVariant = usePHFlag<HomeNewFlagValue>('homeNew')
  const isHomeNewPH = isHomeNewVariant(homeNewVariant)

  if (isHomeNewPH) {
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
