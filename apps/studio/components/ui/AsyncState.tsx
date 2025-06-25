import { Skeleton } from 'ui'
import { CircleAlert, LucideIcon, Wind } from 'lucide-react'

export const Loading = () => <Skeleton className="h-64" />

export const ErrorState = ({
  message = 'An unexpected error has occurred',
}: {
  message?: string
}) => (
  <div className="p-6 text-center">
    <CircleAlert size={32} strokeWidth={1.5} className="text-foreground-muted mx-auto mb-8" />
    <h3 className="mb-1">{message}</h3>
    <p className="text-sm text-foreground-light">
      Please try again in a few minutes and contact support if the problem persists.
    </p>
  </div>
)

export const EmptyState = ({
  title,
  description,
  icon: Icon = Wind,
}: {
  title: string
  description: string
  icon?: LucideIcon
}) => (
  <div className="p-6 text-center">
    <Icon size={32} strokeWidth={1.5} className="text-foreground-muted mx-auto mb-8" />
    <h3 className="mb-1">{title}</h3>
    <p className="text-sm text-foreground-light">{description}</p>
  </div>
)
