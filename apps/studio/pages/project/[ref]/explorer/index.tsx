import { ExplorerHome } from '@/components/interfaces/Explorer/ExplorerHome'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { ExplorerLayout } from '@/components/layouts/ExplorerLayout/ExplorerLayout'
import type { NextPageWithLayout } from '@/types'

const ProjectExplorerPage: NextPageWithLayout = () => {
  return <ExplorerHome />
}

ProjectExplorerPage.getLayout = (page) => (
  <DefaultLayout>
    <ExplorerLayout>{page}</ExplorerLayout>
  </DefaultLayout>
)

export default ProjectExplorerPage
