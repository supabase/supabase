import { FC, useState } from 'react'
import { Button } from '@supabase/ui'

interface ActionBarProps {
  loading?: boolean
  disableApply?: boolean
  hideApply?: boolean
  children?: any
  applyButtonLabel?: string
  backButtonLabel?: string
  applyFunction?: (resolve: any) => void
  closePanel: () => void
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
    <div className="border-scale-500 flex w-full justify-between space-x-3 border-t px-3 py-4">
      <Button size="small" onClick={closePanel} type="default" htmlType="button">
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
        <Button size="small" disabled={disableApply} loading={loading} htmlType="submit">
          {applyButtonLabel}
        </Button>
      ) : (
        <div />
      )}
    </div>
  )
}
export default ActionBar
