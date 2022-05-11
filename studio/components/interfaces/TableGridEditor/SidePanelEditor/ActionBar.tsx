import { FC, useState } from 'react'
import { Button } from '@supabase/ui'

interface ActionBarProps {
  applyButtonLabel?: string
  backButtonLabel?: string
  children?: any
  disableApply?: boolean
  applyFunction?: (resolve: any) => void
  closePanel: () => void
  loading?: boolean
  noApplyFunction?: boolean
}
const ActionBar: FC<ActionBarProps> = ({
  applyButtonLabel = 'Apply',
  backButtonLabel = 'Back',
  children = null,
  disableApply = false,
  applyFunction = null,
  closePanel,
  loading = undefined,
  noApplyFunction = false,
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
      <Button size="small" onClick={closePanel} type="default">
        {backButtonLabel}
      </Button>

      {children}

      {applyFunction && (
        /**
         * old solution
         * this is necessary when loading is handled by this component
         *
         * author @mildtomato
         */
        <Button
          size="small"
          onClick={onSelectApply}
          disabled={disableApply || isRunning}
          loading={isRunning}
        >
          {applyButtonLabel}
        </Button>
      )}

      {noApplyFunction && (
        /**
         * new solution to avoid using applyFunction
         * this is necessary for handling loading by form itself
         *
         * this does not require he applyCallback() above
         *
         * author @mildtomato
         */
        <Button size="small" disabled={disableApply} loading={loading}>
          {applyButtonLabel}
        </Button>
      )}
    </div>
  )
}
export default ActionBar
