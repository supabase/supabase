import { useFlag } from 'common'
import { usePHFlag } from 'hooks/ui/useFlag'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout/ProjectLayout'
import type { NextPageWithLayout } from 'types'
import HomeNew from 'components/interfaces/HomeNew/Home'
import Home from 'components/interfaces/Home/Home'

const HomePage: NextPageWithLayout = () => {
  const isHomeNew = usePHFlag('homeNew')
  if (isHomeNew) {
    return <HomeNew />
  }
  return <Home />
}

HomePage.getLayout = (page) => (
  <DefaultLayout>
    <ProjectLayoutWithAuth>{page}</ProjectLayoutWithAuth>
  </DefaultLayout>
)

export default HomePage
