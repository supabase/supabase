import { useParams } from 'next/navigation'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import SQLTemplates from 'components/interfaces/SQLEditor/SQLTemplates/SQLTemplates'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { EditorBaseLayout } from 'components/layouts/editors/EditorBaseLayout'
import SQLEditorLayout from 'components/layouts/SQLEditorLayout/SQLEditorLayout'
import { SQLEditorMenu } from 'components/layouts/SQLEditorLayout/SQLEditorMenu'
import { createTabId, useTabsStateSnapshot } from 'state/tabs'
import type { NextPageWithLayout } from 'types'

const SqlTemplates: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams<{ ref: string }>()
  const tabs = useTabsStateSnapshot()

  useEffect(() => {
    if (!router.isReady) return

    const tabId = createTabId('sql', { id: 'templates' })
    tabs.addTab({
      id: tabId,
      type: 'sql',
      label: 'Templates',
      metadata: {
        sqlId: 'templates',
        name: 'templates',
      },
    })
  }, [router.isReady, ref])

  return <SQLTemplates />
}

SqlTemplates.getLayout = (page) => (
  <DefaultLayout>
    <EditorBaseLayout productMenu={<SQLEditorMenu />} product="SQL Editor">
      <SQLEditorLayout>{page}</SQLEditorLayout>
    </EditorBaseLayout>
  </DefaultLayout>
)

export default SqlTemplates
