import { useParams } from 'common'
import { useRouter } from 'next/router'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useState } from 'react'
import { toast } from 'sonner'
import { cn } from 'ui'
import {
  InnerSideBarEmptyPanel,
  InnerSideMenuCollapsible,
  InnerSideMenuCollapsibleContent,
  InnerSideMenuCollapsibleTrigger,
} from 'ui-patterns'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { NotebookNavItem } from './NotebookNavItem'
import {
  SQL_EDITOR_NAV_LIST_GAP_CLASSNAME,
  SQL_EDITOR_NAV_SECTION_TRIGGER_CLASSNAME,
  SQL_EDITOR_NAV_TOP_LEVEL_SECTION_CLASSNAME,
} from './SQLEditorNav.constants'
import { SQLEditorSectionActions } from './SQLEditorSectionActions'
import { CreateReportModal } from '@/components/interfaces/Reports/CreateReportModal'
import { useContentDeleteMutation } from '@/data/content/content-delete-mutation'
import { Content, useContentQuery } from '@/data/content/content-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { IS_PLATFORM } from '@/lib/constants'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'

interface NotebookSectionProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const NotebookSection = ({ open, onOpenChange }: NotebookSectionProps) => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const notebookId = (router.query.notebookId ?? router.query.reportId) as string | undefined
  const tabs = useTabsStateSnapshot()
  const { reportsAll } = useIsFeatureEnabled(['reports:all'])
  const [showNewReportModal, setShowNewReportModal] = useQueryState(
    'newReport',
    parseAsBoolean.withDefault(false)
  )
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedNotebookToDelete, setSelectedNotebookToDelete] = useState<Content>()

  const { data: content, isPending: isLoading } = useContentQuery({
    projectRef,
    type: 'report',
  })

  const reports = (content?.content ?? []).filter((report) => {
    const notebookContent = report.content as { meta?: { role?: string } } | undefined
    return notebookContent?.meta?.role !== 'home' && report.name !== 'Home'
  })

  const { mutate: deleteNotebook, isPending: isDeleting } = useContentDeleteMutation({
    onSuccess: (deletedIds) => {
      const tabIds = deletedIds.map((id) => createTabId('notebook', { id }))
      tabs.removeTabs(tabIds)

      const deletedId = selectedNotebookToDelete?.id
      if (deletedId && notebookId === deletedId) {
        const remaining = reports.filter((report) => !deletedIds.includes(report.id))
        if (remaining.length > 0) {
          router.push(`/project/${projectRef}/sql/notebooks/${remaining[0].id}`)
        } else {
          router.push(`/project/${projectRef}/sql/new`)
        }
      }

      setShowDeleteModal(false)
      setSelectedNotebookToDelete(undefined)
      toast.success('Successfully deleted notebook')
    },
    onError: (error) => {
      toast.error(`Failed to delete notebook: ${error.message}`)
    },
  })

  const onConfirmDeleteNotebook = () => {
    if (!projectRef) return console.error('Project ref is required')
    if (!selectedNotebookToDelete?.id) return console.error('Notebook ID is required')
    deleteNotebook({ projectRef, ids: [selectedNotebookToDelete.id] })
  }

  if (!IS_PLATFORM || !reportsAll) return null

  return (
    <>
      <InnerSideMenuCollapsible
        open={open}
        onOpenChange={onOpenChange}
        className={SQL_EDITOR_NAV_TOP_LEVEL_SECTION_CLASSNAME}
      >
        <div className="flex items-center w-full">
          <InnerSideMenuCollapsibleTrigger
            className={SQL_EDITOR_NAV_SECTION_TRIGGER_CLASSNAME}
            title="Notebooks"
          />
          <SQLEditorSectionActions
            onNewSnippet={() => setShowNewReportModal(true)}
            newSnippetTestId="sql-editor-notebooks-new-button"
            newSnippetTooltip="New notebook"
          />
        </div>
        <InnerSideMenuCollapsibleContent className="group-data-open:pt-1">
          {isLoading ? (
            <div className="px-4 py-2 text-xs text-foreground-light">Loading...</div>
          ) : reports.length === 0 ? (
            <InnerSideBarEmptyPanel
              title="No notebooks"
              className="mx-2 px-3"
              description="Create a notebook to organize SQL blocks with chart and table views."
            />
          ) : (
            <div className={cn('flex flex-col px-2', SQL_EDITOR_NAV_LIST_GAP_CLASSNAME)}>
              {reports.map((report) => {
                const tabId = createTabId('notebook', { id: report.id })
                const isPreview = tabs.previewTabId === tabId
                const isActive = !isPreview && notebookId === report.id

                return (
                  <NotebookNavItem
                    key={report.id}
                    report={report}
                    projectRef={projectRef!}
                    isActive={isActive}
                    isPreview={isPreview}
                    onSelectDelete={() => {
                      setSelectedNotebookToDelete(report)
                      setShowDeleteModal(true)
                    }}
                  />
                )
              })}
            </div>
          )}
        </InnerSideMenuCollapsibleContent>
      </InnerSideMenuCollapsible>

      <ConfirmationModal
        title="Delete notebook"
        confirmLabel="Delete notebook"
        confirmLabelLoading="Deleting notebook"
        size="small"
        loading={isDeleting}
        visible={showDeleteModal}
        variant="destructive"
        onCancel={() => {
          setShowDeleteModal(false)
          setSelectedNotebookToDelete(undefined)
        }}
        onConfirm={onConfirmDeleteNotebook}
      >
        <p className="text-sm text-foreground-light">
          This action cannot be undone. Are you sure you want to delete '
          {selectedNotebookToDelete?.name}'?
        </p>
      </ConfirmationModal>

      <CreateReportModal
        visible={showNewReportModal}
        onCancel={() => setShowNewReportModal(false)}
        afterSubmit={() => setShowNewReportModal(false)}
      />
    </>
  )
}
