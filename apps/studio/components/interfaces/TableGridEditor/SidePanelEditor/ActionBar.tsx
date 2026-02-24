import { useHotKey } from 'hooks/ui/useHotKey'
import { getModKeyLabel } from 'lib/helpers'
import { noop } from 'lodash'
import { PropsWithChildren, useCallback, useMemo, useState } from 'react'
import { Button } from 'ui'

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
  const modKeyLabel = useMemo(() => getModKeyLabel(), [])

  const onSelectApply = useCallback(async () => {
    const applyCallback = () => new Promise((resolve) => applyFunction?.(resolve))
    setIsRunning(true)
    await applyCallback()
    setIsRunning(false)
  }, [applyFunction])

  const handleSave = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger if already running/loading, or if apply is disabled/hidden
      if (isRunning || loading || disableApply || hideApply) return

      // Don't trigger if the user is in a textarea (allow multi-line entry)
      // unless they explicitly press CMD+Enter
      const activeElement = document.activeElement
      const isTextarea = activeElement?.tagName === 'TEXTAREA'

      // If in a textarea and this is just an Enter key (not CMD+Enter), don't submit
      if (isTextarea && !event.metaKey && !event.ctrlKey) return

      event.preventDefault()
      event.stopPropagation()

      if (formId) {
        // Form-based submission - programmatically submit the form
        const form = document.getElementById(formId) as HTMLFormElement | null
        if (form) {
          form.requestSubmit()
        }
      } else if (applyFunction) {
        onSelectApply()
      }
    },
    [isRunning, loading, disableApply, hideApply, formId, applyFunction, onSelectApply]
  )

  useHotKey(handleSave, 'Enter', { enabled: visible })

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
          >
            <span>{applyButtonLabel}</span>
            <span className="ml-2 text-xs text-foreground-lighter">{modKeyLabel}↵</span>
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
          >
            <span>{applyButtonLabel}</span>
            <span className="ml-2 text-xs text-foreground-lighter">{modKeyLabel}↵</span>
          </Button>
        ) : (
          <div />
        )}
      </div>
    </div>
  )
}
