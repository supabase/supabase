import { EditorBaseLayout } from 'components/layouts/editors/editor-base-layout'
import { ProjectContextFromParamsProvider } from 'components/layouts/ProjectLayout/ProjectContext'
import SQLEditorLayout from 'components/layouts/SQLEditorLayout/SQLEditorLayout'
import { SQLEditorMenu } from 'components/layouts/SQLEditorLayout/SQLEditorMenu'
import { NewTab } from 'components/layouts/tabs/new-tab'
import type { NextPageWithLayout } from 'types'

const SqlEditorNewPage: NextPageWithLayout = () => {
  return <NewTab />
}

SqlEditorNewPage.getLayout = (page) => (
  <ProjectContextFromParamsProvider>
    <EditorBaseLayout productMenu={<SQLEditorMenu />}>
      <SQLEditorLayout>{page}</SQLEditorLayout>
    </EditorBaseLayout>
  </ProjectContextFromParamsProvider>
)

export default SqlEditorNewPage
