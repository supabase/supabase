import { useParams } from 'common'
import { EditorBaseLayout } from 'components/layouts/editors/editor-base-layout'
import { ProjectContextFromParamsProvider } from 'components/layouts/ProjectLayout/ProjectContext'
import SQLEditorLayout from 'components/layouts/SQLEditorLayout/SQLEditorLayout'
import { SQLEditorMenu } from 'components/layouts/SQLEditorLayout/SQLEditorMenu'
import { NewTab } from 'components/layouts/tabs/new-tab'
import { useRouter } from 'next/router'
import { getTabsStore } from 'state/tabs'
import type { NextPageWithLayout } from 'types'

const TableEditorPage: NextPageWithLayout = () => {
  const { ref: projectRef } = useParams()
  const store = getTabsStore(projectRef)
  const router = useRouter()

  // handle redirect to last table tab
  const lastTabId = store.openTabs.find((id) => store.tabsMap[id]?.type === 'sql')

  if (lastTabId) {
    const lastTab = store.tabsMap[lastTabId]
    if (lastTab) {
      router.push(`/project/${projectRef}/sql/${lastTab.id.replace('sql-', '')}`)
    }
  }

  return (
    <>
      <NewTab />
    </>
  )
}

TableEditorPage.getLayout = (page) => (
  <ProjectContextFromParamsProvider>
    <EditorBaseLayout productMenu={<SQLEditorMenu />}>
      <SQLEditorLayout>{page}</SQLEditorLayout>
    </EditorBaseLayout>
  </ProjectContextFromParamsProvider>
)

export default TableEditorPage
