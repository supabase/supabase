import DefaultLayout from 'components/layouts/DefaultLayout'
import { EditorBaseLayout } from 'components/layouts/editors/EditorBaseLayout'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout/ProjectLayout'
import TableEditorLayout from 'components/layouts/TableEditorLayout/TableEditorLayout'
import TableEditorMenu from 'components/layouts/TableEditorLayout/TableEditorMenu'
import { NewTab } from 'components/layouts/Tabs/NewTab'
import type { NextPageWithLayout } from 'types'

const EditorNewPage: NextPageWithLayout = () => {
  return <NewTab />
}

EditorNewPage.getLayout = (page) => (
  <DefaultLayout hasProductMenu>
    <ProjectLayoutWithAuth productMenu={<TableEditorMenu />} product="Table Editor">
      <EditorBaseLayout>
        <TableEditorLayout>{page}</TableEditorLayout>
      </EditorBaseLayout>
    </ProjectLayoutWithAuth>
  </DefaultLayout>
)

export default EditorNewPage
