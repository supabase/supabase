import * as Tooltip from '@radix-ui/react-tooltip'
import { useUser } from 'common'
import { usePrevious } from 'hooks'
import { AlertCircle, Check, Loader2, RefreshCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import { Button, IconCheck, IconRefreshCcw } from 'ui'
import ReadOnlyBadge from './ReadOnlyBadge'

export type SavingIndicatorProps = { id: string }

const SavingIndicator = ({ id }: SavingIndicatorProps) => {
  const snap = useSqlEditorStateSnapshot()
  const savingState = snap.savingStates[id]
  const user = useUser()

  const previousState = usePrevious(savingState)
  const [showSavedText, setShowSavedText] = useState(false)
  const snippet = snap.snippets[id]
  const isSnippetOwner = user?.user_metadata?.user_name === snippet?.snippet?.owner?.username

  useEffect(() => {
    let cancel = false

    if (previousState === 'UPDATING' && savingState === 'IDLE') {
      setShowSavedText(true)
      setTimeout(() => {
        if (!cancel) setShowSavedText(false)
      }, 3000)
    }

    return () => {
      cancel = true
    }
  }, [savingState])

  const retry = () => {
    snap.addNeedsSaving(id)
  }

  return (
    <>
      <div className="mx-2 flex items-center gap-2">
        {isSnippetOwner && savingState === 'UPDATING_FAILED' && (
          <Button
            type="text"
            size="tiny"
            icon={<RefreshCcw className="text-gray-1100" size="tiny" strokeWidth={2} />}
            onClick={retry}
          >
            Retry
          </Button>
        )}
        {showSavedText ? (
          <Tooltip.Root delayDuration={0}>
            <Tooltip.Trigger>
              <Check className="text-brand" size={14} strokeWidth={3} />
            </Tooltip.Trigger>
            <Tooltip.Content side="bottom">
              <Tooltip.Arrow className="radix-tooltip-arrow" />
              <div
                className={[
                  'bg-alternative rounded py-1 px-2 leading-none shadow',
                  'border-background border ',
                ].join(' ')}
              >
                <span className="text-foreground text-xs">All changes saved</span>
              </div>
            </Tooltip.Content>
          </Tooltip.Root>
        ) : isSnippetOwner && savingState === 'UPDATING' ? (
          <Tooltip.Root delayDuration={0}>
            <Tooltip.Trigger>
              <Loader2 className="animate-spin" size={14} strokeWidth={2} />
            </Tooltip.Trigger>
            <Tooltip.Content side="bottom">
              <Tooltip.Arrow className="radix-tooltip-arrow" />
              <div
                className={[
                  'bg-alternative rounded py-1 px-2 leading-none shadow',
                  'border-background border',
                ].join(' ')}
              >
                <span className="text-foreground text-xs">Saving changes...</span>
              </div>
            </Tooltip.Content>
          </Tooltip.Root>
        ) : savingState === 'UPDATING_FAILED' ? (
          isSnippetOwner ? (
            <Tooltip.Root delayDuration={0}>
              <Tooltip.Trigger>
                <AlertCircle className="text-red-900" size={14} strokeWidth={2} />
              </Tooltip.Trigger>
              <Tooltip.Content side="bottom">
                <Tooltip.Arrow className="radix-tooltip-arrow" />
                <div
                  className={[
                    'bg-alternative rounded py-1 px-2 leading-none shadow',
                    'border-background border ',
                  ].join(' ')}
                >
                  <span className="text-foreground text-xs">Failed to save changes</span>
                </div>
              </Tooltip.Content>
            </Tooltip.Root>
          ) : (
            <ReadOnlyBadge id={id} />
          )
        ) : null}
      </div>
    </>
  )
}

export default SavingIndicator
