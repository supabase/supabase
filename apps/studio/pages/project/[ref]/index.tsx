import { useFlag } from 'common'
import { Home } from 'components/interfaces/Home/Home'
import { HomeV2 } from 'components/interfaces/HomeNew/Home'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout/ProjectLayout'
import type { NextPageWithLayout } from 'types'

const HomePage: NextPageWithLayout = () => {
  const isHomeNew = useFlag('homeNew')
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
