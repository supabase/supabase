import { PermissionAction } from '@supabase/shared-types/out/constants'
import { keepPreviousData } from '@tanstack/react-query'
import { useParams } from 'common'
import { Plus } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'

import { remapNotebookContentFromApi } from '@/components/interfaces/Notebook/notebookBlock.utils'
import {
  createHomeNotebookContent,
  findHomeNotebook,
  NotebookView,
  useNotebookPermissions,
} from '@/components/interfaces/Notebook/NotebookView'
import { useContentQuery } from '@/data/content/content-query'
import { useContentUpsertMutation } from '@/data/content/content-upsert-mutation'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { uuidv4 } from '@/lib/helpers'
import { useProfile } from '@/lib/profile'
import type { Dashboards } from '@/types'

/** Project home embed for the Home notebook */
export function CustomReportSection() {
  const { ref } = useParams()
  const { profile } = useProfile()

  const { data: reportsList } = useContentQuery(
    { projectRef: ref, type: 'report', limit: 100 },
    { placeholderData: keepPreviousData }
  )

  const homeNotebook = useMemo(
    () => findHomeNotebook(reportsList?.content ?? []),
    [reportsList?.content]
  )

  const notebookContent = homeNotebook?.content
    ? remapNotebookContentFromApi(homeNotebook.content as Dashboards.Content)
    : undefined

  const { canReadReport, canUpdateReport } = useNotebookPermissions(homeNotebook)

  const { can: canCreateNotebook } = useAsyncCheckPermissions(
    PermissionAction.CREATE,
    'user_content',
    { resource: { type: 'report', owner_id: profile?.id }, subject: { id: profile?.id } }
  )

  const { mutate: upsertContent, isPending: isCreatingHome } = useContentUpsertMutation()

  const createHomeNotebook = useCallback(() => {
    if (!ref || !profile) return

    upsertContent(
      {
        projectRef: ref,
        payload: {
          id: uuidv4(),
          type: 'report',
          name: 'Home',
          description: '',
          visibility: 'project',
          owner_id: profile.id,
          content: createHomeNotebookContent(),
        },
      },
      {
        onSuccess: () => toast.success('Home notebook created'),
        onError: (error) => toast.error(`Failed to create home notebook: ${error.message}`),
      }
    )
  }, [ref, profile, upsertContent])

  if (!homeNotebook) {
    return (
      <div className="space-y-4">
        <h3 className="heading-section">Notebook</h3>
        <div className="h-48 flex flex-col items-center justify-center rounded-sm border-2 border-dashed p-8">
          <p className="text-sm text-foreground-light mb-4 text-center">
            Pin SQL blocks on your project home with a Home notebook.
          </p>
          {canCreateNotebook ? (
            <Button
              type="default"
              icon={<Plus />}
              loading={isCreatingHome}
              onClick={createHomeNotebook}
            >
              Create Home notebook
            </Button>
          ) : (
            <p className="text-sm text-foreground-light">
              You do not have permission to create notebooks.
            </p>
          )}
        </div>
      </div>
    )
  }

  if (!canReadReport || !notebookContent) {
    return null
  }

  return (
    <div className="space-y-4">
      <NotebookView
        report={homeNotebook}
        reportContent={notebookContent}
        canUpdateReport={canUpdateReport}
        variant="embed"
        showHeader={false}
      />
    </div>
  )
}
