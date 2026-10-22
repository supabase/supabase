import { Check } from 'lucide-react'
import { ReactNode } from 'react'
import { Button, CardContent } from 'ui'

export const RecoveryTaskRow = ({
  title,
  description,
  isComplete,
  children,
}: {
  title: string
  description: string
  isComplete: boolean
  children: ReactNode
}) => (
  <CardContent className="flex flex-col gap-x-8 gap-y-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
    <div className="min-w-0 flex-1 space-y-0.5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-medium">{title}</h2>
      </div>
      <p className="text-sm text-foreground-lighter">{description}</p>
    </div>
    <div className="w-32 shrink-0 [&_button]:w-full">
      {isComplete && (
        <Button
          variant="default"
          size="tiny"
          disabled
          icon={<Check size={14} aria-hidden="true" />}
        >
          Done
        </Button>
      )}
      {children}
    </div>
  </CardContent>
)
