import { ReactNode } from 'react'

export const TicketShare = ({ children }: { children?: ReactNode }) => {
  return <div className='absolute bottom-0 left-0 right-0 grid justify-center gap-2 pb-10'>{children}</div>
}
