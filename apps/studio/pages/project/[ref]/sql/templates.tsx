import { useFeaturePreviewContext } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import SQLTemplates from 'components/interfaces/SQLEditor/SQLTemplates/SQLTemplates'
import { EditorBaseLayout } from 'components/layouts/editors/EditorBaseLayout'
import SQLEditorLayout from 'components/layouts/SQLEditorLayout/SQLEditorLayout'
import { SQLEditorMenu } from 'components/layouts/SQLEditorLayout/SQLEditorMenu'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import { useParams } from 'next/navigation'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { addTab, createTabId } from 'state/tabs'
import type { NextPageWithLayout } from 'types'

const SqlTemplates: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams<{ ref: string }>()

  const { flags } = useFeaturePreviewContext()
  const isSqlEditorTabsEnabled = flags[LOCAL_STORAGE_KEYS.UI_SQL_EDITOR_TABS]

  // Watch for route changes
  useEffect(() => {
    if (isSqlEditorTabsEnabled) {
      if (!router.isReady) return

      const tabId = createTabId('sql', { id: 'templates' })

      addTab(ref, {
        id: tabId,
        type: 'sql',
        label: 'Templates',
        metadata: {
          sqlId: 'templates',
          name: 'templates',
        },
      })
    }
  }, [router.isReady, isSqlEditorTabsEnabled, ref])

  return <SQLTemplates />
}

SqlTemplates.getLayout = (page) => (
  <EditorBaseLayout productMenu={<SQLEditorMenu />} product="SQL Editor">
    <SQLEditorLayout>{page}</SQLEditorLayout>
  </EditorBaseLayout>
)

export default SqlTemplates
