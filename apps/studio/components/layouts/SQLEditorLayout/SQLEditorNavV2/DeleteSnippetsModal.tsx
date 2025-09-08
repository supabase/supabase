import { useRouter } from 'next/router'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useContentDeleteMutation } from 'data/content/content-delete-mutation'
import { Snippet } from 'data/content/sql-folders-query'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import { createTabId, useTabsStateSnapshot } from 'state/tabs'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

export const DeleteSnippetsModal = ({
  snippets,
  visible,
  onClose,
}: {
  visible: boolean
  snippets: Snippet[]
  onClose: () => void
}) => {
  const router = useRouter()
  const { ref: projectRef, id } = useParams()
  const tabs = useTabsStateSnapshot()
  const snapV2 = useSqlEditorV2StateSnapshot()

  const postDeleteCleanup = (ids: string[]) => {
    if (!!id && ids.includes(id)) {
      const openedSQLTabs = tabs.openTabs.filter((x) => x.startsWith('sql-') && !x.includes(id))
      if (openedSQLTabs.length > 0) {
        // [Joshen] For simplicity, just opening the first tab for now
        const firstTabId = openedSQLTabs[0].split('sql-')[1]
        router.push(`/project/${projectRef}/sql/${firstTabId}`)
      } else {
        router.push(`/project/${projectRef}/sql/new`)
      }
    }

    if (ids.length > 0) ids.forEach((id) => snapV2.removeSnippet(id))
  }

  const { mutate: deleteContent, isLoading: isDeleting } = useContentDeleteMutation({
    onSuccess: (data) => {
      toast.success(
        `Successfully deleted ${snippets.length.toLocaleString()} quer${snippets.length > 1 ? 'ies' : 'y'}`
      )

      // Update Tabs state - currently unknown how to differentiate between sql and non-sql content
      // so we're just deleting all tabs for with matching IDs
      const tabIds = data.map((id) => createTabId('sql', { id }))
      tabs.removeTabs(tabIds)

      postDeleteCleanup(data)
      onClose()
    },
    onError: (error, data) => {
      if (error.message.includes('Contents not found')) {
        postDeleteCleanup(data.ids)
        onClose()
      } else {
        toast.error(`Failed to delete query: ${error.message}`)
      }
    },
  })

  const onConfirmDelete = () => {
    if (!projectRef) return console.error('Project ref is required')
    deleteContent({ projectRef, ids: snippets.map((x) => x.id) })
  }

  return (
    <ConfirmationModal
      size="small"
      visible={visible}
      title={`Confirm to delete ${snippets.length === 1 ? 'query' : `${snippets.length.toLocaleString()} quer${snippets.length > 1 ? 'ies' : 'y'}`}`}
      confirmLabel={`Delete ${snippets.length.toLocaleString()} quer${snippets.length > 1 ? 'ies' : 'y'}`}
      confirmLabelLoading="Deleting query"
      loading={isDeleting}
      variant="destructive"
      onCancel={onClose}
      onConfirm={onConfirmDelete}
      alert={
        (snippets[0]?.visibility as unknown as string) === 'project'
          ? {
              title: 'This SQL snippet will be lost forever',
              description:
                'Deleting this query will remove it for all members of the project team.',
            }
          : undefined
      }
    >
      <p className="text-sm">
        This action cannot be undone.{' '}
        {snippets.length === 1
          ? `Are you sure you want to delete '${snippets[0]?.name}'?`
          : `Are you sure you want to delete the selected ${snippets.length} quer${snippets.length > 1 ? 'ies' : 'y'}?`}
      </p>
    </ConfirmationModal>
  )
}
