import cn from 'classnames'
import Tilt from 'vanilla-tilt'
import { useRef, useEffect, useState } from 'react'
// import { TicketGenerationState } from '@lib/constants'
// import {isMobileOrTablet} from '~/lib/helpers'
// import { scrollTo } from '@lib/smooth-scroll'
import styles from './ticket.module.css'
import styleUtils from './utils.module.css'
import TicketForm from './ticket-form'
import TicketVisual from './ticket-visual'
import TicketActions from './ticket-actions'
import TicketCopy from './ticket-copy'
import { DATE, SITE_NAME } from '~/lib/constants'
import Form from './form'
import { UserData } from './hooks/use-conf-data'

type TicketGenerationState = 'default' | 'loading'
type Props = {
  username: UserData['username']
  ticketNumber: UserData['ticketNumber']
  name: UserData['name']
  golden: UserData['golden']
  referrals: number
  sharePage?: boolean
}

export default function Ticket({
  username,
  name,
  ticketNumber,
  sharePage,
  golden,
  referrals,
}: Props) {
  const ticketRef = useRef<HTMLDivElement>(null)
  const [ticketGenerationState, setTicketGenerationState] =
    useState<TicketGenerationState>('default')
  const divRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ticketRef.current && !window.matchMedia('(pointer: coarse)').matches) {
      Tilt.init(ticketRef.current, {
        glare: true,
        max: 5,
        'max-glare': 0.16,
        'full-page-listening': true,
      })
    }
  }, [ticketRef])

  // useEffect(() => {
  //   if (!sharePage && divRef && divRef.current && isMobileOrTablet()) {
  //     scrollTo(divRef.current, -30)
  //   }
  // }, [divRef, sharePage])
  // golden = true

  return (
    <div
      className="grid grid-cols-1 xl:grid-cols-12 gap-8 xl:gap-8 2xl:gap-16 p-4 bg-[#a988d748] rounded-2xl"
      id="wayfinding--ticket-visual-wrapper-container"
    >
      <div
        className={cn(styles['ticket-visual-wrapper'], 'col-span-8')}
        id="wayfinding--ticket-visual-wrapper"
      >
        <div
          ref={ticketRef}
          className={cn(
            styles['ticket-visual'],
            styleUtils.appear,
            styleUtils['appear-fourth'],
            'relative mx-2 rounded-xl'
          )}
          id="wayfinding--ticket-visual-outer-container"
        >
          <TicketVisual
            username={username ?? undefined}
            name={name ?? undefined}
            ticketNumber={ticketNumber ?? undefined}
            ticketGenerationState={ticketGenerationState}
            setTicketGenerationState={setTicketGenerationState}
            golden={golden}
          />
        </div>
        {!sharePage && (
          <>
            {username ? (
              <div className="flex flex-col gap-6 py-4 mx-8">
                <div>
                  <TicketCopy username={username} />
                </div>
                {/* <div className={`flex flex-col xl:flex-row gap-3 items-center justify-center`}>
                  <TicketActions username={username} golden={golden} />
                </div> */}
              </div>
            ) : (
              <div className={styles['ticket-actions-placeholder']} />
            )}
          </>
        )}
      </div>
      <div ref={divRef} className="flex flex-col gap-6 col-span-4">
        <div
          className={`
          text-scale-1200
          flex flex-col
          items-center
          text-center xl:text-left
          xl:items-start
          gap-3
          `}
        >
          <h1 className={cn(styleUtils.appear, styleUtils['appear-first'], 'text-xl xl:text-3xl')}>
            {sharePage ? (
              name ? (
                <p className="text-3xl dark:text-scale-1200 tracking-[0.02rem]">{name}'s ticket</p>
              ) : (
                <p className="text-3xl dark:text-scale-1200 tracking-[0.02rem]">{SITE_NAME}</p>
              )
            ) : golden ? (
              <p className="text-xl dark:text-scale-1200 tracking-[0.02rem]">Congratulations!</p>
            ) : (
              <p className="text-2xl dark:text-scale-1200 tracking-[0.02rem]">
                Generate your ticket. Win the{' '}
                <span className="gradient-text-purple-500">SupaKeyboard</span>.
              </p>
            )}
          </h1>
          <h2 className="text-base max-w-[520px]">
            {sharePage ? (
              <p>
                Join {name ?? 'us'} on {DATE}.
              </p>
            ) : golden ? (
              <>
                <p>
                  You got a Golden ticket. This means you’re in, and you also won a Supabase sticker
                  pack!
                </p>
                <p>Referrals: {referrals}</p>
              </>
            ) : (
              <>
                <p>
                  We have some fantastic swag up for grabs, including 3x limited edition mechanical
                  keyboard that you won't want to miss.
                </p>
                {username && (
                  <p>
                    {`<<<<`} Referrals: {referrals} {`>>>>`}
                  </p>
                )}
              </>
            )}
          </h2>
        </div>
        <div className={cn(styleUtils.appear, styleUtils['appear-third'])}>
          {username && <TicketActions username={username} golden={golden} />}
        </div>
      </div>
    </div>
  )
}
