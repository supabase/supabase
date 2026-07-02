import { usePrevious } from '@uidotdev/usehooks'
import { AlertCircle, Check, Loader2, RefreshCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import ReadOnlyBadge from './ReadOnlyBadge'
import { useProfile } from '@/lib/profile'
import { useSqlEditorV2StateSnapshot } from '@/state/sql-editor-v2'
import { isSaveFailed, isSaving } from '@/state/sql-editor/sql-editor-lifecycle'
import { isSnippetOwner } from '@/state/sql-editor/sql-editor-rules'
import { useSqlEditorSaveCoordinator } from '@/state/sql-editor/sql-editor-save-coordinator'

export type SavingIndicatorProps = { id: string }

const SavingIndicator = ({ id }: SavingIndicatorProps) => {
  const { profile } = useProfile()
  const snapV2 = useSqlEditorV2StateSnapshot()

  const snippet = snapV2.snippets[id]
  const status = snippet?.snippet.status
  const saving = isSaving(status)
  const saveFailed = isSaveFailed(status)
  const previousSaving = usePrevious(saving)
  const [showSavedText, setShowSavedText] = useState(false)

  const snippetIsOwned = !!snippet && isSnippetOwner(snippet.snippet, profile?.id)
  const { requestSave } = useSqlEditorSaveCoordinator()

  useEffect(() => {
    let cancel = false

    if (previousSaving && status === 'saved') {
      setShowSavedText(true)
      setTimeout(() => {
        if (!cancel) setShowSavedText(false)
      }, 5000)
    }

    return () => {
      cancel = true
    }
  }, [status, previousSaving])

  const retry = () => requestSave(id)

  return (
    <>
      <div className="mx-2 flex items-center gap-2">
        {snippetIsOwned && saveFailed && (
          <Button
            variant="text"
            size="tiny"
            icon={<RefreshCcw className="text-gray-1100" strokeWidth={2} />}
            onClick={retry}
          >
            Retry
          </Button>
        )}
        {showSavedText ? (
          <Tooltip>
            <TooltipTrigger>
              <Check className="text-brand" size={14} strokeWidth={3} />
            </TooltipTrigger>
            <TooltipContent side="bottom">All changes saved</TooltipContent>
          </Tooltip>
        ) : saving ? (
          <Tooltip>
            <TooltipTrigger>
              <Loader2 className="animate-spin" size={14} strokeWidth={2} />
            </TooltipTrigger>
            <TooltipContent>Saving changes...</TooltipContent>
          </Tooltip>
        ) : saveFailed ? (
          snippetIsOwned ? (
            <Tooltip>
              <TooltipTrigger>
                <AlertCircle className="text-red-900" size={14} strokeWidth={2} />
              </TooltipTrigger>
              <TooltipContent>Failed to save changes</TooltipContent>
            </Tooltip>
          ) : (
            <ReadOnlyBadge id={id} />
          )
        ) : null}
      </div>
    </>
  )
}

export default SavingIndicator
