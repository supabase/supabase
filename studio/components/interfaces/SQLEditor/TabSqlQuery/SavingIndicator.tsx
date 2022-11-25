import { FC, useState, useEffect } from 'react'
import { toJS } from 'mobx'
import { observer } from 'mobx-react-lite'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Button, IconAlertCircle, IconCheck, IconLoader, IconRefreshCcw } from 'ui'

import { useStore, usePrevious } from 'hooks'
import { useSqlStore } from 'localStores/sqlEditor/SqlEditorStore'

interface Props {
  updateSqlSnippet: (value: any) => void
}

const SavingIndicator: FC<Props> = ({ updateSqlSnippet }) => {
  const { content } = useStore()
  const sqlEditorStore: any = useSqlStore()
  const previousState = usePrevious(content.savingState)
  const [showSavedText, setShowSavedText] = useState(false)

  // @ts-ignore
  useEffect(() => {
    let cancel = false

    if (
      (previousState === 'CREATING' || previousState === 'UPDATING') &&
      content.savingState === 'IDLE'
    ) {
      setShowSavedText(true)
      setTimeout(() => {
        if (!cancel) setShowSavedText(false)
      }, 3000)
    }

    return () => (cancel = true)
  }, [content.savingState])

  const retry = () => {
    const [item] = content.list((item: any) => item.id === sqlEditorStore.selectedTabId)

    if (content.savingState === 'CREATING_FAILED' && item) {
      content.save(toJS(item))
    }

    if (content.savingState === 'UPDATING_FAILED' && item) {
      updateSqlSnippet(sqlEditorStore.activeTab.query)
    }
  }

  return (
    <div className="mx-2 flex items-center gap-2">
      {(content.savingState === 'CREATING_FAILED' || content.savingState === 'UPDATING_FAILED') && (
        <Button
          type="text"
          size="tiny"
          shadow={false}
          icon={<IconRefreshCcw className="text-gray-1100" size="tiny" strokeWidth={2} />}
          onClick={retry}
        >
          Retry
        </Button>
      )}
      {(content.savingState === 'CREATING' || content.savingState === 'UPDATING') && (
        <Tooltip.Root delayDuration={0}>
          <Tooltip.Trigger>
            <IconLoader className="animate-spin" size={14} strokeWidth={2} />
          </Tooltip.Trigger>
          <Tooltip.Content side="bottom">
            <Tooltip.Arrow className="radix-tooltip-arrow" />
            <div
              className={[
                'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                'border border-scale-200',
              ].join(' ')}
            >
              <span className="text-xs text-scale-1200">Saving changes...</span>
            </div>
          </Tooltip.Content>
        </Tooltip.Root>
      )}
      {(content.savingState === 'CREATING_FAILED' || content.savingState === 'UPDATING_FAILED') && (
        <IconAlertCircle className="text-red-900" size={14} strokeWidth={2} />
      )}
      {showSavedText && (
        <Tooltip.Root delayDuration={0}>
          <Tooltip.Trigger>
            <IconCheck className="text-brand-900" size={14} strokeWidth={3} />
          </Tooltip.Trigger>
          <Tooltip.Content side="bottom">
            <Tooltip.Arrow className="radix-tooltip-arrow" />
            <div
              className={[
                'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                'border border-scale-200 ',
              ].join(' ')}
            >
              <span className="text-xs text-scale-1200">All changes saved</span>
            </div>
          </Tooltip.Content>
        </Tooltip.Root>
      )}
      <span className="text-sm text-scale-1000">
        {content.savingState === 'CREATING_FAILED' && 'Failed to create'}
        {content.savingState === 'UPDATING_FAILED' && 'Failed to save'}
      </span>
    </div>
  )
}

export default observer(SavingIndicator)
