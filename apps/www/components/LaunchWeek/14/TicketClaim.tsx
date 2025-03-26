import Image from 'next/image'
import { ReactNode } from 'react'
import logo from './assets/logo.png'
import useConfData from './hooks/use-conf-data'

export const TicketClaim = ({ children }: { children: ReactNode }) => {
  return (
    <div className="grid w-full gap-8 sm:gap-16 absolute z-10 top-[3%] sm:top-[5%] 2xl:top-[15%] left-0 h-full justify-center justify-items-center p-10 content-start">
      {children}
    </div>
  )
}

export const TicketClaimLogo = () => {
  return (
    <div className="grid content-center">
      <Image src={logo} alt="LW logo" className="size-12" width="48" height="48" />
      <div className="hidden md:block">LW 14</div>
    </div>
  )
}

export const TicketClaimContent = ({ children }: { children?: ReactNode }) => {
  return <div className="grid gap-6 content-center">{children}</div>
}

export const TicketClaimMessage = () => {
  const [state] = useConfData()
  return (
    <div className="grid justify-center gap-3">
      <div className="inline-flex flex-col justify-center items-center gap-1 font-mono">
        <div className="self-stretch text-center justify-center text-emerald-400 text-xl leading-7 [text-shadow:_0px_0px_12px_rgb(255_255_255_/_0.35)]">
          LAUNCH WEEK 14
        </div>
        <div className="text-center justify-center text-white text-xl leading-7 [text-shadow:_0px_0px_4px_rgb(44_244_148_/_0.25)]">
          MAR 31 — APR 4<span className="hidden md:inline"> / 7AM PT</span>
        </div>
      </div>
      <div className="opacity-70 text-center justify-center text-white md:text-base font-mono leading-normal [text-shadow:_0px_0px_4px_rgb(255_255_255_/_0.25)] text-sm text-balance max-w-[310px] md:max-w-[400px]">
        Join {state.referal ?? 'us'} for a week of new features and level up your development!
      </div>
    </div>
  )
}

export const TicketClaimButtons = ({ children }: { children?: ReactNode }) => {
  return <div className="inline-flex justify-center items-center gap-2.5 flex-wrap">{children}</div>
}
