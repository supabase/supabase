import SectionContainer from '~/components/Layouts/SectionContainer'
import { ReactNode } from 'react'

export const TicketLayout = ({ children }: { children: ReactNode }) => {
  return (
    <SectionContainer className="font-mono grid gap-12">
      {children}
    </SectionContainer>
  )
}

export const TicketLayoutCanvas = ({ children }: { children: ReactNode }) => {
  return <div className='relative'>{children}</div>
}
