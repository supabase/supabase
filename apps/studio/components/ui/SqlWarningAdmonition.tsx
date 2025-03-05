import { Button } from 'ui'
import { Admonition } from 'ui-patterns'

export interface SqlWarningAdmonitionProps {
  warningType: 'hasWriteOperation' | 'hasUnknownFunctions'
  onCancel: () => void
  onConfirm: () => void
  disabled?: boolean
  className?: string
}

const SqlWarningAdmonition = ({
  warningType,
  onCancel,
  onConfirm,
  disabled = false,
  className,
}: SqlWarningAdmonitionProps) => {
  return (
    <Admonition
      type="warning"
      className={`mb-0 rounded-none border-0 shrink-0 bg-background-100 ${className}`}
    >
      <p>
        {warningType === 'hasWriteOperation'
          ? 'This query contains write operations.'
          : 'This query involves running a function.'}{' '}
        Are you sure you want to execute it?
      </p>
      <p className="text-foreground-light">
        Make sure you are not accidentally removing something important.
      </p>
      <div className="flex justify-stretch mt-2 gap-2">
        <Button type="outline" size="tiny" className="w-full flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="danger"
          size="tiny"
          disabled={disabled}
          className="w-full flex-1"
          onClick={onConfirm}
        >
          Run
        </Button>
      </div>
    </Admonition>
  )
}

export default SqlWarningAdmonition
