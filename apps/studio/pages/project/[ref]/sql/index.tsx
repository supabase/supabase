import { useParams } from 'common'
import { HandleEditorLayouts } from 'components/layouts/editors/handle-editor-layouts'
import { ProjectContextFromParamsProvider } from 'components/layouts/ProjectLayout/ProjectContext'
import { NewTab } from 'components/layouts/tabs/new-tab'
import { useRouter } from 'next/router'
import { getTabsStore } from 'state/tabs'
import type { NextPageWithLayout } from 'types'

const TableEditorPage: NextPageWithLayout = () => {
  const { ref: projectRef } = useParams()
  const store = getTabsStore()
  const router = useRouter()

  // handle redirect to last table tab
  const lastTabId = store.openTabs.find((id) => store.tabsMap[id]?.type === 'sql')

  console.log('lastTabId in SQL id', lastTabId)
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
    <HandleEditorLayouts>{page}</HandleEditorLayouts>
  </ProjectContextFromParamsProvider>
)

export default TableEditorPage
