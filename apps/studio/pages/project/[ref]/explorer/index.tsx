import { ExplorerLayout } from 'components/layouts/explorer/layout'
import { ProjectContextFromParamsProvider } from 'components/layouts/ProjectLayout/ProjectContext'
import type { NextPageWithLayout } from 'types'

const ExplorerPage: NextPageWithLayout = () => {
  return (
    <>
      <div className="p-4 flex justify-center items-center h-full w-full ">
        Empty state for explorer
      </div>
    </>
  )
}

ExplorerPage.getLayout = (page) => (
  <ProjectContextFromParamsProvider>
    <ExplorerLayout hideTabs>{page}</ExplorerLayout>
  </ProjectContextFromParamsProvider>
)

export default ExplorerPage
