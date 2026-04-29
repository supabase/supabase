import { noop } from 'lodash'
import { PropsWithChildren, useCallback, useState } from 'react'
import { Button, KeyboardShortcut } from 'ui'

import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

interface ActionBarProps {
  loading?: boolean
  disableApply?: boolean
  hideApply?: boolean
  applyButtonLabel?: string
  backButtonLabel?: string
  applyFunction?: (resolve: any) => void
  closePanel: () => void
  formId?: string
  visible?: boolean
}

export const ActionBar = ({
  loading = false,
  disableApply = false,
  hideApply = false,
  children = undefined,
  applyButtonLabel = 'Apply',
  backButtonLabel = 'Back',
  applyFunction = undefined,
  closePanel = noop,
  formId,
  visible = true,
}: PropsWithChildren<ActionBarProps>) => {
  const [isRunning, setIsRunning] = useState(false)

  const onSelectApply = useCallback(async () => {
    const applyCallback = () => new Promise((resolve) => applyFunction?.(resolve))
    setIsRunning(true)
    await applyCallback()
    setIsRunning(false)
  }, [applyFunction])

  const handleSave = useCallback(() => {
    if (isRunning || loading || disableApply || hideApply) return

    if (formId) {
      const form = document.getElementById(formId) as HTMLFormElement | null
      if (form) {
        form.requestSubmit()
      }
    } else if (applyFunction) {
      onSelectApply()
    }
  }, [isRunning, loading, disableApply, hideApply, formId, applyFunction, onSelectApply])

  useShortcut(SHORTCUT_IDS.ACTION_BAR_SAVE, handleSave, { enabled: visible })

  return (
    <div className="flex w-full items-center gap-3 border-t border-default px-3 py-4">
      {children}

      <div className="flex items-center gap-3 ml-auto">
        <Button
          type="default"
          htmlType="button"
          onClick={closePanel}
          disabled={isRunning || loading}
        >
          {backButtonLabel}
        </Button>

        {applyFunction !== undefined ? (
          // Old solution, necessary when loading is handled by this component itself
          <Button
            onClick={onSelectApply}
            disabled={disableApply || isRunning || loading}
            loading={isRunning || loading}
            iconRight={
              isRunning || loading ? undefined : (
                <KeyboardShortcut keys={['Meta', 'Enter']} variant="inline" />
              )
            }
          >
            {applyButtonLabel}
          </Button>
        ) : !hideApply ? (
          // New solution, when using the Form component, loading is handled by the Form itself
          // Does not require applyFunction() callback
          <Button
            disabled={loading || disableApply}
            loading={loading}
            data-testid="action-bar-save-row"
            htmlType="submit"
            form={formId}
            iconRight={
              loading ? undefined : <KeyboardShortcut keys={['Meta', 'Enter']} variant="inline" />
            }
          >
            {applyButtonLabel}
          </Button>
        ) : (
          <div />
        )}
      </div>
    </div>
  )
}
