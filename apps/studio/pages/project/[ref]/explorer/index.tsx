import { ExplorerLayout } from 'components/layouts/explorer/layout'
import { ProjectContextFromParamsProvider } from 'components/layouts/ProjectLayout/ProjectContext'
import { NewTab } from 'components/layouts/tabs/new-tab'
import type { NextPageWithLayout } from 'types'

const ExplorerPage: NextPageWithLayout = () => {
  return <NewTab />
}

ExplorerPage.getLayout = (page) => (
  <ProjectContextFromParamsProvider>
    <ExplorerLayout>{page}</ExplorerLayout>
  </ProjectContextFromParamsProvider>
)

export default ExplorerPage
