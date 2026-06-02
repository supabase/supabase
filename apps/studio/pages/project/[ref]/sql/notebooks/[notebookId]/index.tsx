import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { Admonition } from 'ui-patterns'

import { remapNotebookContentFromApi } from '@/components/interfaces/Notebook/notebookBlock.utils'
import { NotebookView, useNotebookPermissions } from '@/components/interfaces/Notebook/NotebookView'
import DefaultLayout from '@/components/layouts/DefaultLayout'
import { EditorBaseLayout } from '@/components/layouts/editors/EditorBaseLayout'
import SQLEditorLayout from '@/components/layouts/SQLEditorLayout/SQLEditorLayout'
import { SQLEditorMenu } from '@/components/layouts/SQLEditorLayout/SQLEditorMenu'
import NoPermission from '@/components/ui/NoPermission'
import { useContentQuery } from '@/data/content/content-query'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'
import type { Dashboards, NextPageWithLayout } from '@/types'

const NotebookPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref, notebookId } = useParams()
  const tabs = useTabsStateSnapshot()

  const { data: reportsData, isPending: isLoadingReports } = useContentQuery({
    projectRef: ref,
    type: 'report',
  })

  const currentNotebook = reportsData?.content.find((r) => r.id === notebookId)
  const notebookContent = currentNotebook?.content
    ? remapNotebookContentFromApi(currentNotebook.content as Dashboards.Content)
    : undefined

  const { canReadReport, canUpdateReport, isLoadingPermissions } =
    useNotebookPermissions(currentNotebook)

  useEffect(() => {
    if (!router.isReady || !notebookId || !currentNotebook) return

    const tabId = createTabId('notebook', { id: notebookId })

    tabs.addTab({
      id: tabId,
      type: 'notebook',
      label: currentNotebook.name,
      metadata: {
        notebookId,
        name: currentNotebook.name,
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, notebookId, currentNotebook?.id, currentNotebook?.name])

  if (isLoadingReports || isLoadingPermissions) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-foreground-light text-sm">Loading notebook...</span>
      </div>
    )
  }

  if (!currentNotebook || !notebookContent) {
    return (
      <Admonition type="destructive" title="Notebook not found">
        This notebook may have been deleted or you may not have access to it.
      </Admonition>
    )
  }

  if (!canReadReport) {
    return <NoPermission resourceText="view this notebook" />
  }

  return (
    <NotebookView
      report={currentNotebook}
      reportContent={notebookContent}
      canUpdateReport={canUpdateReport}
    />
  )
}

NotebookPage.getLayout = (page) => (
  <DefaultLayout>
    <EditorBaseLayout productMenu={<SQLEditorMenu />} product="Explorer">
      <SQLEditorLayout>{page}</SQLEditorLayout>
    </EditorBaseLayout>
  </DefaultLayout>
)

export default NotebookPage
