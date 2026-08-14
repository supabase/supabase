import { Eye, Unlock } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { getContentById } from '@/data/content/content-id-query'
import { useContentUpsertMutation } from '@/data/content/content-upsert-mutation'

type ReportSnippet = { id: string; name: string }

export const MakeReportSnippetPublicModal = ({
  projectRef,
  snippet,
  onCancel,
  onConfirm,
}: {
  projectRef?: string
  snippet?: ReportSnippet
  onCancel: () => void
  onConfirm: (snippet: ReportSnippet) => void
}) => {
  const [isPreparing, setIsPreparing] = useState(false)

  const { mutate: upsertContent, isPending: isUpserting } = useContentUpsertMutation({
    onError: (error) => {
      toast.error(`Failed to share snippet: ${error.message}`)
    },
  })

  const onMakePublic = async () => {
    if (!projectRef) return console.error('Project ref is required')
    if (!snippet) return console.error('Snippet is required')

    setIsPreparing(true)
    try {
      const item = await getContentById({ projectRef, id: snippet.id })
      upsertContent(
        {
          projectRef,
          payload: { ...item, visibility: 'project', folder_id: null },
        },
        {
          onSuccess: () => {
            toast.success('Snippet is now shared to the project')
            onConfirm(snippet)
          },
        }
      )
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(`Failed to share snippet: ${error.message}`)
      }
    } finally {
      setIsPreparing(false)
    }
  }

  return (
    <ConfirmationModal
      size="medium"
      loading={isPreparing || isUpserting}
      title={`Share snippet with the team: ${snippet?.name}`}
      confirmLabel="Share and add to report"
      confirmLabelLoading="Sharing snippet"
      visible={snippet !== undefined}
      onCancel={onCancel}
      onConfirm={onMakePublic}
      alert={{
        title: 'This snippet will become visible to all project members',
        description: 'Snippets added to the report must be shared so the team can view them',
      }}
    >
      <ul className="text-sm text-foreground-light space-y-5">
        <li className="flex gap-3 items-center">
          <Eye size={16} />
          <span>Project members will have read-only access to this snippet.</span>
        </li>
        <li className="flex gap-3 items-center">
          <Unlock size={16} />
          <span>Project members can duplicate it to their personal snippets.</span>
        </li>
      </ul>
    </ConfirmationModal>
  )
}
