import { AlertCircle, Check, Loader2, RefreshCcw } from 'lucide-react'
import { useEffect, useState } from 'react'

import { usePrevious } from 'hooks/deprecated'
import { useProfile } from 'lib/profile'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import ReadOnlyBadge from './ReadOnlyBadge'

export type SavingIndicatorProps = { id: string }

const SavingIndicator = ({ id }: SavingIndicatorProps) => {
  const { profile } = useProfile()
  const snapV2 = useSqlEditorV2StateSnapshot()

  const savingState = snapV2.savingStates[id]
  const previousState = usePrevious(savingState)
  const [showSavedText, setShowSavedText] = useState(false)

  const snippet = snapV2.snippets[id]
  const isSnippetOwner = profile?.id === snippet?.snippet.owner_id

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
        {isSnippetOwner && savingState === 'UPDATING_FAILED' && (
          <Button
            type="text"
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
          isSnippetOwner ? (
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
