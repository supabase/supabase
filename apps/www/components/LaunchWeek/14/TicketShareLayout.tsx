import Image from 'next/image'
import { ReactNode } from 'react'
import { cn } from 'ui'
import useLw14ConfData from './hooks/use-conf-data'
import logo from './assets/logo.png'

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
        'absolute top-[250px] xs:top-[290px] md:top-auto md:bottom-10 xl:bottom-16 2xl:bottom-20 left-0 right-0 grid justify-center gap-2',
        {
          ['lg:left-0 lg:pr-10 xl:pr-0 xl:left-[5%] lg:right-1/2 lg:justify-start lg:pl-10 lg:bottom-0 xl:bottom-0 2xl:bottom-0 lg:top-0 lg:content-center']:
            narrow,
        }
      )}
    >
      {narrow && (
        <>
          <Image
            src={logo}
            alt="LW logo"
            className="size-12 hidden lg:block"
            width="48"
            height="48"
          />
          <div className="text-xl py-6 text-center lg:text-start">
            Good to see you{userWelcomeText}
          </div>
        </>
      )}
      <div
        className={cn(
          'text-xs text-center pb-2 [text-shadow:_0px_0px_4px_rgb(255_255_255_/_0.50)]',
          { ['lg:text-start']: narrow }
        )}
      >
        Share your ticket with friends!
      </div>
      {children}
    </div>
  )
}
