import { ReactNode } from 'react'
import { cn } from 'ui'
import useLw14ConfData from './hooks/use-conf-data'

export const TicketShareLayout = ({
  children,
  narrow,
}: {
  children?: ReactNode
  narrow?: boolean
}) => {
  const [{ userTicketData }] = useLw14ConfData()

  const userName = userTicketData.name ?? userTicketData.username
  let userWelcomeText = userName ? <span>, {userName}!</span> : '!'

  return (
    <div
      className={cn(
        'absolute lg:relative lg:flex lg:flex-col lg:max-w-[450px] xl:max-w-[500px] lg:h-full left-0 right-0 grid justify-center gap-2 md:px-5 lg:px-0 px-6',
        narrow
          ? 'top-[280px] md:top-[360px] lg:top-0 lg:left-0 lg:right-auto lg:justify-center'
          : 'top-[250px] xs:top-[290px] md:top-auto md:bottom-10 xl:bottom-16 2xl:bottom-20'
      )}
    >
      {narrow && (
        <>
          {/* <Image
            src={logo}
            alt="LW logo"
            className="size-12 hidden lg:block"
            width="48"
            height="48"
          /> */}
          <div className='uppercase text-3xl lg:text-4xl py-4 text-left font-["Departure_Mono"]'>
            Good to see you{userWelcomeText}
          </div>
        </>
      )}
      <div
        className={cn(
          'text-xs pb-2 font-["Departure_Mono"] uppercase text-foreground-lighter',
          narrow ? 'text-left' : 'text-center'
        )}
      >
        Share your ticket for a chance to win swag
      </div>
      {children}
    </div>
  )
}
