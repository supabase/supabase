import { HandleEditorLayouts } from 'components/layouts/editors/handle-editor-layouts'
import { ProjectContextFromParamsProvider } from 'components/layouts/ProjectLayout/ProjectContext'
import { NewTab } from 'components/layouts/tabs/new-tab'
import type { NextPageWithLayout } from 'types'

const SqlEditorNewPage: NextPageWithLayout = () => {
  return <NewTab />
}

SqlEditorNewPage.getLayout = (page) => (
  <ProjectContextFromParamsProvider>
    <HandleEditorLayouts>{page}</HandleEditorLayouts>
  </ProjectContextFromParamsProvider>
)

export default SqlEditorNewPage
