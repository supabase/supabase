import { ReactNode } from 'react'
import { cn } from 'ui'
import SectionContainerWithCn from '~/components/Layouts/SectionContainerWithCn'

export const TicketLayout = ({ children }: { children: ReactNode }) => {
  return <SectionContainerWithCn height="narrow" className="font-mono grid gap-6 md:gap-8 max-w-none px-6">{children}</SectionContainerWithCn>
}

const TicketLayoutCanvasCorner = ({ className }: { className?: string }) => {
  return (
    <div className={cn('w-4 h-4 absolute', className)}>
      <div className="w-4 h-0.5 left-0 top-0 absolute bg-emerald-500 shadow-[0px_0px_4px_0px_rgba(44,244,148,0.25)]" />
      <div className="w-4 h-0.5 left-[16px] top-0 absolute origin-top-left rotate-90 bg-emerald-500 shadow-[0px_0px_4px_0px_rgba(44,244,148,0.25)]" />
    </div>
  )
}

export const TicketLayoutCanvas = ({ children, narrow }: { children: ReactNode, narrow: true }) => {
  return (
    <div className={ cn( "relative w-full h-[650px] lg:h-auto lg:aspect-[1.5841584158] border border-neutral-800", { ["h-[530px] lg:aspect-[2.3] xl:aspect-[2.9473684211]"]: narrow}  ) }>
      <TicketLayoutCanvasCorner className="top-[-1px] left-[-1px] -rotate-90"></TicketLayoutCanvasCorner>
      <TicketLayoutCanvasCorner className="top-[-1px] right-[-1px]"></TicketLayoutCanvasCorner>
      <TicketLayoutCanvasCorner className="bottom-[-1px] left-[-1px] rotate-180"></TicketLayoutCanvasCorner>
      <TicketLayoutCanvasCorner className="bottom-[-1px] right-[-1px] rotate-90"></TicketLayoutCanvasCorner>
      {children}
    </div>
  )
}
