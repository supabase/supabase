import { useParams } from 'next/navigation'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import SQLExamples from '@/components/interfaces/SQLEditor/SQLTemplates/SQLExamples'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { EditorBaseLayout } from '@/components/layouts/editors/EditorBaseLayout'
import SQLEditorLayout from '@/components/layouts/SQLEditorLayout/SQLEditorLayout'
import { SQLEditorMenu } from '@/components/layouts/SQLEditorLayout/SQLEditorMenu'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'
import type { NextPageWithLayout } from '@/types'

const SqlExamples: NextPageWithLayout = () => {
  const router = useRouter()
  const ref = useParams<{ ref: string }>()?.ref
  const tabs = useTabsStateSnapshot()

  useEffect(() => {
    if (!router.isReady) return

    const tabId = createTabId('sql', { id: 'examples' })
    tabs.addTab({
      id: tabId,
      type: 'sql',
      label: 'Examples',
      metadata: {
        sqlId: 'examples',
        name: 'examples',
      },
    })
  }, [router.isReady, ref])

  return <SQLExamples />
}

SqlExamples.getLayout = (page) => (
  <DefaultLayout>
    <EditorBaseLayout productMenu={<SQLEditorMenu />} product="SQL Editor">
      <SQLEditorLayout>{page}</SQLEditorLayout>
    </EditorBaseLayout>
  </DefaultLayout>
)

export default SqlExamples
