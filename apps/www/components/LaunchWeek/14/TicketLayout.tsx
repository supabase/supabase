import { ReactNode } from 'react'
import { cn } from 'ui'
import SectionContainerWithCn from '~/components/Layouts/SectionContainerWithCn'

export const TicketLayout = ({ children }: { children: ReactNode }) => {
  return (
    <SectionContainerWithCn id="ticket" className="lw-nav-anchor font-mono z-20 relative px-0">
      {children}
    </SectionContainerWithCn>
  )
}

export const TicketLayoutCanvas = ({ children, narrow }: { children: ReactNode; narrow: true }) => {
  return (
    <div
      className={cn('relative w-full h-[650px] lg:h-auto lg:aspect-[1.5841584158]', {
        ['h-[530px] lg:aspect-[2.3] xl:aspect-[2.9473684211]']: narrow,
      })}
    >
      {children}
    </div>
  )
}
