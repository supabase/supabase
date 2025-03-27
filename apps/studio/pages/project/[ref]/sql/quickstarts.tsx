import { useParams } from 'next/navigation'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { useIsSQLEditorTabsEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import SQLQuickstarts from 'components/interfaces/SQLEditor/SQLTemplates/SQLQuickstarts'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { EditorBaseLayout } from 'components/layouts/editors/EditorBaseLayout'
import SQLEditorLayout from 'components/layouts/SQLEditorLayout/SQLEditorLayout'
import { SQLEditorMenu } from 'components/layouts/SQLEditorLayout/SQLEditorMenu'
import { addTab, createTabId } from 'state/tabs'
import type { NextPageWithLayout } from 'types'

const SqlQuickstarts: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams<{ ref: string }>()

  const isSqlEditorTabsEnabled = useIsSQLEditorTabsEnabled()

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
  <DefaultLayout>
    <EditorBaseLayout productMenu={<SQLEditorMenu />} product="SQL Editor">
      <SQLEditorLayout>{page}</SQLEditorLayout>
    </EditorBaseLayout>
  </DefaultLayout>
)

export default SqlQuickstarts
