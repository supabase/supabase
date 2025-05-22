import Image from 'next/image'
import { ActionButton } from '~/components/LaunchWeek/14/ActionButton'
import {
  TicketHeader,
  TicketHeaderClaim,
  TicketHeaderDate,
  TicketHeaderRemainingTime,
} from '~/components/LaunchWeek/14/Header'
import TicketCanvas from '~/components/LaunchWeek/14/TicketCanvas'
import {
  TicketClaim,
  TicketClaimButtons,
  TicketClaimContent,
  TicketClaimMessage,
} from '~/components/LaunchWeek/14/TicketClaim'
import TicketCopy from '~/components/LaunchWeek/14/TicketCopy'
import { TicketLayout, TicketLayoutCanvas } from '~/components/LaunchWeek/14/TicketLayout'
import TicketShare from '~/components/LaunchWeek/14/TicketShare'
import { Tunnel } from '~/components/LaunchWeek/14/Tunnel'
import { TicketShareLayout } from '~/components/LaunchWeek/14/TicketShareLayout'
import { useRegistration } from '~/components/LaunchWeek/14/hooks/use-registration'
import useConfData from './hooks/use-conf-data'
import { cn } from 'ui'

const dates = [new Date('2025-03-31T07:00:00.000-08:00')]

export const LwView = () => {
  const [state] = useConfData()
  const register = useRegistration()

  return (
    <TicketLayout>
      <TicketHeader hidden={true}>
        <TicketHeaderRemainingTime targetDate={dates[0]} />
        <TicketHeaderClaim />
        <TicketHeaderDate />
      </TicketHeader>
      <TicketLayoutCanvas narrow={true}>
        <TicketCanvas narrow={true} onUpgradeToSecret={register.upgradeTicket} />
        {state.claimFormState === 'visible' && (
          <TicketClaim>
            <div className="flex flex-col md:flex-row gap-12 lg:gap-2 grow w-full min-w-full max-w-full pt-16 md:pt-32 md:px-6 lg:px-0 lg:py-0 items-center">
              <div className='flex flex-col gap-2 w-full grow justify-center font-["Departure_Mono"]'>
                <h1 className="text-4xl uppercase tracking-wide pointer-events-none">
                  <span className="flex gap-1 items-center">
                    <Image
                      src="/images/launchweek/14/logo-pixel-small-dark.png"
                      width="18"
                      height="20"
                      className="w-auto h-5 invert dark:invert-0"
                      alt=""
                    />
                    Supabase
                  </span>
                  LaunchWeek 14
                  <span className="block mt-2 text-foreground-lighter">MAR 31 — APR 04</span>
                </h1>
                <span className="block mt-2 text-foreground-lighter">7 AM PT</span>
              </div>
              <div className="flex flex-row gap-2 z-10 w-full grow justify-start lg:justify-end">
                <TicketClaimContent>
                  <TicketClaimButtons>
                    <ActionButton variant="primary" icon="T" onClick={() => register.signIn()}>
                      CLAIM YOUR TICKET
                    </ActionButton>
                  </TicketClaimButtons>
                  <TicketClaimMessage />
                </TicketClaimContent>
              </div>
            </div>
          </TicketClaim>
        )}
        {state.ticketVisibility && (
          <>
            <TicketShareLayout narrow>
              <TicketCopy />
              <TicketShare />
            </TicketShareLayout>
          </>
        )}

        <div
          className={cn(
            'w-full absolute bottom-[50%] md:bottom-[25%] lg:-bottom-8 xl:-bottom-16 left-0 right-0 -z-20 overflow-hidden flex justify-center',
            { ['hidden']: state.claimFormState === 'visible' }
          )}
        >
          <Tunnel />
        </div>
      </TicketLayoutCanvas>
    </TicketLayout>
  )
}
