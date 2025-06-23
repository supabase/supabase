import { useParams } from 'next/navigation'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import SQLQuickstarts from 'components/interfaces/SQLEditor/SQLTemplates/SQLQuickstarts'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { EditorBaseLayout } from 'components/layouts/editors/EditorBaseLayout'
import SQLEditorLayout from 'components/layouts/SQLEditorLayout/SQLEditorLayout'
import { SQLEditorMenu } from 'components/layouts/SQLEditorLayout/SQLEditorMenu'
import { createTabId, useTabsStateSnapshot } from 'state/tabs'
import type { NextPageWithLayout } from 'types'

const SqlQuickstarts: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams<{ ref: string }>()
  const tabs = useTabsStateSnapshot()

  useEffect(() => {
    if (!router.isReady) return

    const tabId = createTabId('sql', { id: 'quickstarts' })
    tabs.addTab({
      id: tabId,
      type: 'sql',
      label: 'Quickstarts',
      metadata: {
        sqlId: 'quickstarts',
        name: 'quickstarts',
      },
    })
  }, [router.isReady, ref])

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
