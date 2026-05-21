import { cn } from 'ui'

interface EventsContainerProps {
  children: React.ReactNode
  className?: string
  id?: string
}

export function EventsContainer({ children, className, id }: EventsContainerProps) {
  return (
    <div
      id={id}
      className={cn('relative mx-auto w-full max-w-5xl px-4 lg:px-10 xl:px-14', className)}
    >
      {children}
    </div>
  )
}
