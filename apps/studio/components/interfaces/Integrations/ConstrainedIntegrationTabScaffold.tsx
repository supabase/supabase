import { PropsWithChildren } from 'react'
import { cn } from 'ui'

interface ConstrainedIntegrationTabScaffoldProps extends PropsWithChildren {
  className?: string
}

export const ConstrainedIntegrationTabScaffold = ({
  children,
  className,
}: ConstrainedIntegrationTabScaffoldProps) => (
  <div className={cn('w-full py-6 xl:py-10', className)}>{children}</div>
)
