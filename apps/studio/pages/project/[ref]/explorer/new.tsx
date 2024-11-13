import { ExplorerLayout } from 'components/layouts/explorer/layout'
import { ProjectContextFromParamsProvider } from 'components/layouts/ProjectLayout/ProjectContext'
import { NewTab } from 'components/layouts/tabs/new-tab'
import { NextPageWithLayout } from 'types'

const ExplorerNewPage: NextPageWithLayout = () => {
  return <NewTab />
}

ExplorerNewPage.getLayout = (page) => (
  <ProjectContextFromParamsProvider>
    <ExplorerLayout>{page}</ExplorerLayout>
  </ProjectContextFromParamsProvider>
)

export default ExplorerNewPage
