import { PropsWithChildren } from 'react'
import { cn } from 'ui'

import { DocsButton } from '@/components/ui/DocsButton'

interface ObservabilityReportToolbarActionsProps extends PropsWithChildren {
  docsHref: string
  topic: string
  className?: string
}

export function ObservabilityReportToolbarActions({
  docsHref,
  topic,
  children,
  className,
}: ObservabilityReportToolbarActionsProps) {
  return (
    <div className={cn('ml-auto flex items-center gap-2 flex-wrap', className)}>
      <DocsButton href={docsHref} topic={topic} />
      {children}
    </div>
  )
}
