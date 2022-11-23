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
  sharePage?: boolean
}

export default function Ticket({ username, name, ticketNumber, sharePage, golden }: Props) {
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

  return (
    <div
      className={cn(styles['ticket-layout'], {
        [styles['ticket-share-layout']]: sharePage,
      })}
    >
      <div ref={divRef}>
        <div className={styles['ticket-text']}>
          <h2 className={cn(styles.hero, styleUtils.appear, styleUtils['appear-first'])}>
            {sharePage ? (
              name ? (
                <>{name}’s Ticket</>
              ) : (
                <>{SITE_NAME}</>
              )
            ) : golden ? (
              <>
                You won a golden ticket! <br /> Claim it now!
              </>
            ) : (
              <>
                You're in. <br /> Make it unique.
              </>
            )}
          </h2>
          <p className={cn(styles.description, styleUtils.appear, styleUtils['appear-second'])}>
            {sharePage ? (
              <>
                Join {name ?? 'us'} on {DATE}.
              </>
            ) : golden ? (
              <>Claim your ticket with GitHub and Tweet it to redeem your swag pack!</>
            ) : (
              <>
                Generate a unique ticket image with <br className={styleUtils['hide-on-mobile']} />
                your GitHub profile.
              </>
            )}
          </p>
        </div>
        <div className={cn(styleUtils.appear, styleUtils['appear-third'])}>
          {!sharePage ? (
            <TicketForm
              defaultUsername={username ?? undefined}
              setTicketGenerationState={setTicketGenerationState}
            />
          ) : (
            <Form sharePage align="Left" />
          )}
        </div>
      </div>
      <div className={styles['ticket-visual-wrapper']}>
        <div
          ref={ticketRef}
          className={cn(styles['ticket-visual'], styleUtils.appear, styleUtils['appear-fourth'])}
        >
          <TicketVisual
            username={username ?? undefined}
            name={name ?? undefined}
            ticketNumber={ticketNumber ?? undefined}
            ticketGenerationState={ticketGenerationState}
            golden={golden}
          />
        </div>
        {!sharePage && (
          <>
            {username ? (
              <div>
                <div className={styles['ticket-actions']}>
                  <TicketActions username={username} golden={golden} />
                </div>
                <div className={styles['ticket-copy']}>
                  <TicketCopy username={username} />
                </div>
              </div>
            ) : (
              <div className={styles['ticket-actions-placeholder']} />
            )}
          </>
        )}
      </div>
    </div>
  )
}
