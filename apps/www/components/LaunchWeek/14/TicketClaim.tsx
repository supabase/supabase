import Image from 'next/image'
import { ReactNode } from 'react'
import logo from './assets/logo.png'

export const TicketClaim = ({ children }: { children: ReactNode }) => {
  return (
    <div className="grid w-full gap-4 absolute z-10 top-0 left-0 h-full justify-center justify-items-center content-center">
      {children}
    </div>
  )
}

export const TicketClaimLogo = () => {
  return (
    <div className="grid">
      <Image src={logo} alt="LW logo" className="size-12" width="48" height="48" />
      <div>LW 14</div>
    </div>
  )
}

export const TicketClaimContent = ({ children }: { children?: ReactNode }) => {
  return <div className="">{children}</div>
}

export const TicketClaimMessage = () => {
  return (
    <div>
      <div className="inline-flex flex-col justify-start items-center gap-1 font-mono">
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
export const TicketClaimButton = ({ onClick }: { onClick?: () => void }) => {
  return (
    <div className="inline-flex justify-start items-center gap-2.5">
      <div
        data-property-1="Link"
        className="pl-1.5 pr-3 py-1.5 bg-gradient-to-b from-emerald-400/0 via-emerald-400/30 to-emerald-400/0 rounded shadow-[0px_0px_6px_0px_rgba(44,244,148,0.40)] outline outline-1 outline-offset-[-1px] outline-emerald-400/60 flex justify-center items-center gap-2"
      >
        <div className="w-5 h-5 px-2 bg-emerald-950 rounded-sm outline outline-1 outline-offset-[-1px] outline-emerald-400/50 inline-flex flex-col justify-center items-center gap-2">
          <div className="text-center justify-center text-neutral-50 text-xs font-normal font-['DM_Mono'] leading-none [text-shadow:_0px_0px_4px_rgb(255_255_255_/_0.25)]">
            T
          </div>
        </div>
        <div
          className="justify-center text-white text-xs font-normal leading-none [text-shadow:_0px_0px_10px_rgb(255_255_255_/_1.00)]"
          onClick={onClick}
        >
          CLAIM YOUR TICKET
        </div>
      </div>
      <div className="pl-1.5 pr-3 py-1.5 bg-gradient-to-b from-neutral-600/0 via-neutral-600/30 to-neutral-600/0 rounded shadow-[0px_0px_6px_0px_rgba(255,255,255,0.10)] outline outline-1 outline-offset-[-1px] outline-white/10 flex justify-center items-center gap-2">
        <div className="w-5 h-5 px-2 bg-neutral-800 rounded-sm outline outline-1 outline-offset-[-1px] outline-stone-500/50 inline-flex flex-col justify-center items-center gap-2">
          <div className="text-center justify-center text-neutral-50 text-xs font-normal font-['DM_Mono'] leading-none [text-shadow:_0px_0px_4px_rgb(255_255_255_/_0.25)]">
            P
          </div>
        </div>
        <div className="justify-center text-white text-xs font-normal font-['DM_Mono'] leading-none [text-shadow:_0px_0px_4px_rgb(255_255_255_/_0.44)]">
          Party mode: on
        </div>
      </div>
    </div>
  )
}
