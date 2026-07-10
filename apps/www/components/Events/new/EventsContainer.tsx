import { cn } from 'ui'

import SectionContainer from '../../Layouts/SectionContainer'

interface EventsContainerProps {
  children: React.ReactNode
  className?: string
}

export function EventsContainer({ children, className }: EventsContainerProps) {
  return (
    <SectionContainer className={cn('w-full max-w-5xl py-8! px-4 lg:px-10 xl:px-14', className)}>
      {children}
    </SectionContainer>
  )
}
