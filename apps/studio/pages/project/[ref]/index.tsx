import { IS_PLATFORM } from 'common'
import { Home } from 'components/interfaces/Home/Home'
import { ProjectHome } from 'components/interfaces/ProjectHome/Home'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout'
import type { NextPageWithLayout } from 'types'

const HomePage: NextPageWithLayout = () => {
  return IS_PLATFORM ? <ProjectHome /> : <Home />
}

HomePage.getLayout = (page) => (
  <DefaultLayout>
    <ProjectLayoutWithAuth>{page}</ProjectLayoutWithAuth>
  </DefaultLayout>
)

export default HomePage
