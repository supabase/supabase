import { FC, useState } from 'react'
import { Button } from '@supabase/ui'

interface ActionBarProps {
  applyButtonLabel?: string
  backButtonLabel?: string
  children?: any
  disableApply?: boolean
  applyFunction?: (resolve: any) => void
  closePanel: () => void
}
const ActionBar: FC<ActionBarProps> = ({
  applyButtonLabel = 'Apply',
  backButtonLabel = 'Back',
  children = null,
  disableApply = false,
  applyFunction = null,
  closePanel,
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
    <div className="space-x-3 w-full flex justify-between px-3 py-4 border-t border-scale-500">
      <Button size="small" onClick={closePanel} type="default">
        {backButtonLabel}
      </Button>
      {children}
      {applyFunction && (
        <Button
          size="small"
          onClick={onSelectApply}
          disabled={disableApply || isRunning}
          loading={isRunning}
        >
          {applyButtonLabel}
        </Button>
      )}
    </div>
  )
}
export default ActionBar
