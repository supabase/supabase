import { ReactNode } from 'react'
import useConfData from './hooks/use-conf-data'

export const TicketClaim = ({ children, narrow }: { children: ReactNode; narrow?: boolean }) => {
  return <div className={'flex px-6'}>{children}</div>
}

export const TicketClaimContent = ({ children }: { children?: ReactNode }) => {
  return <div className="grid gap-6 content-center">{children}</div>
}

export const TicketClaimMessage = () => {
  const [state] = useConfData()
  return (
    <div className="grid justify-center gap-3 md:px-16">
      <div className='md:text-center md:justify-center text-foreground-lighter md:text-sm font-["Departure_Mono"] leading-normal [text-shadow:_0px_0px_4px_rgb(255_255_255_/_0.25)] text-sm text-balance max-w-[310px] md:max-w-[400px] uppercase'>
        Share your ticket for a chance to win swag
      </div>
    </div>
  )
}

export const TicketClaimButtons = ({ children }: { children?: ReactNode }) => {
  return (
    <div className="inline-flex md:justify-center md:items-center gap-2.5 flex-wrap">
      {children}
    </div>
  )
}
