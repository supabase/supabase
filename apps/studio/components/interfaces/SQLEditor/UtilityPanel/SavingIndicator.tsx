import { usePrevious } from '@uidotdev/usehooks'
import { AlertCircle, Check, Loader2, RefreshCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import ReadOnlyBadge from './ReadOnlyBadge'
import { useProfile } from '@/lib/profile'
import { useSqlEditorV2StateSnapshot } from '@/state/sql-editor-v2'
import { isSnippetOwner } from '@/state/sql-editor/sql-editor-rules'

export type SavingIndicatorProps = { id: string }

const SavingIndicator = ({ id }: SavingIndicatorProps) => {
  const { profile } = useProfile()
  const snapV2 = useSqlEditorV2StateSnapshot()

  const savingState = snapV2.savingStates[id]
  const previousState = usePrevious(savingState)
  const [showSavedText, setShowSavedText] = useState(false)

  const snippet = snapV2.snippets[id]
  const snippetIsOwned = !!snippet && isSnippetOwner(snippet.snippet, profile?.id)

  useEffect(() => {
    let cancel = false

    if (previousState === 'UPDATING' && savingState === 'IDLE') {
      setShowSavedText(true)
      setTimeout(() => {
        if (!cancel) setShowSavedText(false)
      }, 5000)
    }

    return () => {
      cancel = true
    }
  }, [savingState])

  const retry = () => snapV2.addNeedsSaving(id)

  return (
    <>
      <div className="mx-2 flex items-center gap-2">
        {snippetIsOwned && savingState === 'UPDATING_FAILED' && (
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
        ) : savingState === 'UPDATING' ? (
          <Tooltip>
            <TooltipTrigger>
              <Loader2 className="animate-spin" size={14} strokeWidth={2} />
            </TooltipTrigger>
            <TooltipContent>Saving changes...</TooltipContent>
          </Tooltip>
        ) : savingState === 'UPDATING_FAILED' ? (
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
