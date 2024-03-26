import { useState } from 'react'
import { SupabaseClient } from '@supabase/supabase-js'
import Link from 'next/link'
import cn from 'classnames'
import { Button } from 'ui'

import styles from './ticket.module.css'
import styleUtils from '../../utils.module.css'
import Ticket from './Ticket'
import TicketActions from '~/components/LaunchWeek/8/Ticket/TicketActions'
import TicketCopy from '~/components/LaunchWeek/8/Ticket/ticket-copy'
import { UserData } from '~/components/LaunchWeek/hooks/use-conf-data'
import useWinningChances from '~/components/LaunchWeek/hooks/useWinningChances'
import { SITE_URL } from '~/lib/constants'
import { useBreakpoint } from 'common/hooks/useBreakpoint'
import TicketCustomizationForm from './TicketCustomizationForm'
import TicketDisclaimer from './TicketDisclaimer'

type TicketGenerationState = 'default' | 'loading'

type Props = {
  user: UserData
  supabase: SupabaseClient
  referrals: number
  sharePage?: boolean
}

export default function TicketContainer({ user, sharePage, referrals, supabase }: Props) {
  const { username, name, golden } = user
  const isMobile = useBreakpoint(1023)
  const [ticketGenerationState, setTicketGenerationState] =
    useState<TicketGenerationState>('default')
  const winningChances = useWinningChances()

  if (!user.username)
    return (
      <div className="w-full flex items-center justify-center min-h-[400px]">
        <div
          className={cn(
            styles['ticket-visual'],
            styleUtils.appear,
            styleUtils['appear-first'],
            'relative flex flex-col items-center gap-2 w-full max-w-2xl'
          )}
        >
          <Ticket
            user={user}
            ticketGenerationState={ticketGenerationState}
            setTicketGenerationState={setTicketGenerationState}
          />
          <TicketDisclaimer className="mt-4" />
        </div>
      </div>
    )

  return (
    <div
      className={[
        `relative w-full max-w-sm md:max-w-[700px] lg:max-w-[1100px] min-h-[400px] flex flex-col items-center lg:grid lg:grid-cols-12 gap-4 lg:p-4 rounded-3xl backdrop-blur lg:items-stretch h-auto`,
        !isMobile && styles['ticket-hero'],
      ].join(' ')}
    >
      <div
        className={[
          'flex flex-col !w-full h-full justify-center max-w-lg lg:max-w-none col-span-full p-6 lg:col-span-4 rounded-3xl backdrop-blur lg:backdrop-blur-none',
          isMobile && styles['ticket-hero'],
        ].join(' ')}
      >
        <div className="text-foreground flex flex-col w-full items-center text-center lg:text-left lg:items-start gap-3">
          <h1 className={cn('text-2xl tracking-[-0.02rem] leading-7 block text-white')}>
            {!sharePage ? (
              name ? (
                <>
                  {winningChances === 1 && (
                    <>
                      <span className="text-white">You're in! </span>
                      Now make it unique and share.
                    </>
                  )}
                  {winningChances === 2 && (
                    <>
                      <span className="text-white">That's x2!</span>
                      <br className="inline lg:hidden" /> Share again to get a golden ticket.
                    </>
                  )}
                  {winningChances === 3 && (
                    <>
                      You have a <span className={styles['gold-text']}>golden </span>
                      chance of winning!
                    </>
                  )}
                </>
              ) : (
                <>
                  Generate your ticket. <br />
                  Win the <span className="gradient-text-purple-800">SupaKeyboard</span>.
                </>
              )
            ) : (
              <>
                {name ? name : username}'s <br className="hidden lg:inline" />
                unique ticket
              </>
            )}
          </h1>

          <div className="text-sm text-foreground-light leading-5">
            {!sharePage ? (
              golden ? (
                <p>
                  Join us on August 11th for Launch Week 8's final day and find out if you are one
                  of the lucky winners.
                </p>
              ) : (
                <p>
                  Customize your ticket and boost your chances of winning{' '}
                  <Link href="#lw8-prizes" className="underline hover:text-foreground">
                    limited edition awards
                  </Link>{' '}
                  by sharing it with the community.
                </p>
              )
            ) : (
              <>
                <p>
                  Generate and share your own custom ticket for a chance to win{' '}
                  <Link href="#lw8-prizes" className="underline hover:text-foreground">
                    awesome swag
                  </Link>
                  .
                </p>

                <Button type="secondary" asChild>
                  <a
                    href={`${SITE_URL}/${username ? '?referral=' + username : ''}`}
                    className="w-full mt-4 lg:mt-8"
                  >
                    Join Launch Week 8
                  </a>
                </Button>
              </>
            )}
          </div>

          {!sharePage && user.username && (
            <TicketCustomizationForm user={user} supabase={supabase} />
          )}
        </div>
      </div>
      <div className="w-full flex-1 col-span-8 lg:-mt-12">
        <div
          className={cn(
            styles['ticket-visual'],
            styleUtils.appear,
            styleUtils['appear-first'],
            'relative flex flex-col items-center gap-4 w-full'
          )}
        >
          <Ticket
            user={user}
            ticketGenerationState={ticketGenerationState}
            setTicketGenerationState={setTicketGenerationState}
          />
          {username && (
            <div className="w-full">
              <TicketActions
                username={username}
                golden={golden}
                ticketGenerationState={ticketGenerationState}
                setTicketGenerationState={setTicketGenerationState}
              />
              <TicketCopy username={username} isGolden={golden} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
