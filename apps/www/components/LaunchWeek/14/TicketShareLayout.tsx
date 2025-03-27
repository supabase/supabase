import { ReactNode } from 'react'

export const TicketShareLayout = ({ children }: { children?: ReactNode }) => {
  return (
    <div className="absolute top-[250px] xs:top-[290px] md:top-auto md:bottom-10 xl:bottom-16 2xl:bottom-20 left-0 right-0 grid justify-center gap-2">
      <div className="text-xs text-center pb-2 [text-shadow:_0px_0px_4px_rgb(255_255_255_/_0.50)]">
        Share your ticket with friends!
      </div>
      {children}
    </div>
  )
}
