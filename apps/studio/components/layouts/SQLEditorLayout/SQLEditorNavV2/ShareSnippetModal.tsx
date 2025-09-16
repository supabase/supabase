import { Eye, Unlock } from 'lucide-react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { getContentById } from 'data/content/content-id-query'
import { useContentUpsertMutation } from 'data/content/content-upsert-mutation'
import { Snippet } from 'data/content/sql-folders-query'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import { SqlSnippets } from 'types'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

export const ShareSnippetModal = ({
  snippet,
  onClose,
  onSuccess,
}: {
  snippet?: Snippet
  onClose: () => void
  onSuccess?: () => void
}) => {
  const { ref: projectRef } = useParams()
  const snapV2 = useSqlEditorV2StateSnapshot()

  const { mutate: upsertContent, isLoading: isUpserting } = useContentUpsertMutation({
    onError: (error) => {
      toast.error(`Failed to update query: ${error.message}`)
    },
  })

  const onShareSnippet = async () => {
    if (!projectRef) return console.error('Project ref is required')
    if (!snippet) return console.error('Snippet ID is required')

    const storeSnippet = snapV2.snippets[snippet.id]
    let snippetContent = storeSnippet?.snippet?.content

    if (snippetContent === undefined) {
      const { content } = await getContentById({ projectRef, id: snippet.id })
      snippetContent = content as unknown as SqlSnippets.Content
    }

    // [Joshen] Just as a final check - to ensure that the content is minimally there (empty string is fine)
    if (snippetContent === undefined) {
      return toast.error('Unable to update snippet visibility: Content is missing')
    }

    upsertContent(
      {
        projectRef,
        payload: {
          ...snippet,
          visibility: 'project',
          folder_id: null,
          content: snippetContent,
        },
      },
      {
        onSuccess: () => {
          snapV2.updateSnippet({
            id: snippet.id,
            snippet: { visibility: 'project', folder_id: null },
            skipSave: true,
          })
          toast.success('Snippet is now shared to the project')
          onSuccess?.()
          onClose()
        },
      }
    )
  }

  return (
    <ConfirmationModal
      size="medium"
      loading={isUpserting}
      title={`Confirm to share query: ${snippet?.name}`}
      confirmLabel="Share query"
      confirmLabelLoading="Sharing query"
      visible={snippet !== undefined}
      onCancel={() => onClose()}
      onConfirm={() => onShareSnippet()}
      alert={{
        title: 'This SQL query will become public to all team members',
        description: 'Anyone with access to the project can view it',
      }}
    >
      <ul className="text-sm text-foreground-light space-y-5">
        <li className="flex gap-3 items-center">
          <Eye size={16} />
          <span>Project members will have read-only access to this query.</span>
        </li>
        <li className="flex gap-3 items-center">
          <Unlock size={16} />
          <span>Anyone will be able to duplicate it to their personal snippets.</span>
        </li>
      </ul>
    </ConfirmationModal>
  )
}
