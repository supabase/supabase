import { cn } from 'ui'

interface EventsContainerProps {
  children: React.ReactNode
  className?: string
}

export function EventsContainer({ children, className }: EventsContainerProps) {
  return (
    <div className={cn('relative mx-auto w-full max-w-5xl px-4 lg:px-10 xl:px-14', className)}>
      {children}
    </div>
  )
}
