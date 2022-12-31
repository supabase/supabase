import { FC, useState } from 'react'
import { Button } from 'ui'

interface ActionBarProps {
  loading?: boolean
  disableApply?: boolean
  hideApply?: boolean
  children?: any
  applyButtonLabel?: string
  backButtonLabel?: string
  applyFunction?: (resolve: any) => void
  closePanel: () => void
  formId?: string
}
const ActionBar: FC<ActionBarProps> = ({
  loading = false,
  disableApply = false,
  hideApply = false,
  children = undefined,
  applyButtonLabel = 'Apply',
  backButtonLabel = 'Back',
  applyFunction = undefined,
  closePanel = () => {},
  formId,
}) => {
  const [isRunning, setIsRunning] = useState(false)

  // @ts-ignore
  const applyCallback = () => new Promise((resolve) => applyFunction(resolve))

  const onSelectApply = async () => {
    setIsRunning(true)
    await applyCallback()
    setIsRunning(false)
  }

  return (
    <div className="flex w-full justify-end space-x-3 border-t border-scale-500 px-3 py-4">
      <Button size="small" type="default" htmlType="button" onClick={closePanel}>
        {backButtonLabel}
      </Button>

      {children}

      {applyFunction !== undefined ? (
        // Old solution, necessary when loading is handled by this component itself
        <Button
          size="small"
          onClick={onSelectApply}
          disabled={disableApply || isRunning}
          loading={isRunning}
        >
          {applyButtonLabel}
        </Button>
      ) : !hideApply ? (
        // New solution, when using the Form component, loading is handled by the Form itself
        // Does not require applyFunction() callback
        <Button
          size="small"
          disabled={disableApply}
          loading={loading}
          htmlType="submit"
          form={formId}
        >
          {applyButtonLabel}
        </Button>
      ) : (
        <div />
      )}
    </div>
  )
}
export default ActionBar
