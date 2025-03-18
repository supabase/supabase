import Image from 'next/image'
import { ReactNode } from 'react'
import logo from './assets/logo.png'

export const TicketClaim = ({ children }: { children: ReactNode }) => {
  return (
    <div className="grid w-full gap-16 absolute z-10 top-0 left-0 h-full justify-center justify-items-center content-center p-10">
      {children}
    </div>
  )
}

export const TicketClaimLogo = () => {
  return (
    <div className="grid content-center">
      <Image src={logo} alt="LW logo" className="size-12" width="48" height="48" />
      <div>LW 14</div>
    </div>
  )
}

export const TicketClaimContent = ({ children }: { children?: ReactNode }) => {
  return <div className="grid gap-6 content-center">{children}</div>
}

export const TicketClaimMessage = () => {
  return (
    <div className="grid justify-center">
      <div className="inline-flex flex-col justify-center items-center gap-1 font-mono">
        <div className="self-stretch text-center justify-center text-emerald-400 text-xl leading-7 [text-shadow:_0px_0px_12px_rgb(255_255_255_/_0.35)]">
          LAUNCH WEEK 14
        </div>
        <div className="text-center justify-center text-white text-xl leading-7 [text-shadow:_0px_0px_4px_rgb(44_244_148_/_0.25)]">
          2 — 5 DECEMBER / 7AM PT
        </div>
      </div>
      <div className="opacity-70 text-center justify-center text-white text-base font-mono leading-normal [text-shadow:_0px_0px_4px_rgb(255_255_255_/_0.25)]">
        Join us for a week of new features
        <br />
        and level up your development!
      </div>
      <div className="flex"></div>
    </div>
  )
}

export const TicketClaimButtons = ({ children }: { children?: ReactNode }) => {
  return <div className="inline-flex justify-start items-center gap-2.5">{children}</div>
}
