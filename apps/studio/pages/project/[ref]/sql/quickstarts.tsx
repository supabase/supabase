import { useFeaturePreviewContext } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import SQLQuickstarts from 'components/interfaces/SQLEditor/SQLTemplates/SQLQuickstarts'
import { EditorBaseLayout } from 'components/layouts/editors/editor-base-layout'
import { ProjectContextFromParamsProvider } from 'components/layouts/ProjectLayout/ProjectContext'
import SQLEditorLayout from 'components/layouts/SQLEditorLayout/SQLEditorLayout'
import { SQLEditorMenu } from 'components/layouts/SQLEditorLayout/SQLEditorMenu'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import { useParams } from 'next/navigation'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { addTab, createTabId } from 'state/tabs'
import type { NextPageWithLayout } from 'types'

const SqlQuickstarts: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams<{ ref: string }>()

  const { flags } = useFeaturePreviewContext()
  const isSqlEditorTabsEnabled = flags[LOCAL_STORAGE_KEYS.UI_SQL_EDITOR_TABS]

  // Watch for route changes
  useEffect(() => {
    if (isSqlEditorTabsEnabled) {
      if (!router.isReady) return

      const tabId = createTabId('sql', { id: 'quickstarts' })

      addTab(ref, {
        id: tabId,
        type: 'sql',
        label: 'Quickstarts',
        metadata: {
          sqlId: 'quickstarts',
          name: 'quickstarts',
        },
      })
    }
  }, [router.isReady, isSqlEditorTabsEnabled, ref])

  return <SQLQuickstarts />
}

SqlQuickstarts.getLayout = (page) => (
  <ProjectContextFromParamsProvider>
    <EditorBaseLayout productMenu={<SQLEditorMenu />} product="SQL Editor">
      <SQLEditorLayout>{page}</SQLEditorLayout>
    </EditorBaseLayout>
  </ProjectContextFromParamsProvider>
)

export default SqlQuickstarts
