import TicketCanvas from '~/components/LaunchWeek/14/TicketCanvas'
import DefaultLayout from '~/components/Layouts/Default'
import { TicketLayout, TicketLayoutCanvas } from '~/components/LaunchWeek/14/TicketLayout'
import {
  TicketHeader,
  TicketHeaderClaim,
  TicketHeaderDate,
  TicketHeaderRemainingTime,
} from '~/components/LaunchWeek/14/Header'
import {
  TicketClaim,
  TicketClaimButtons,
  TicketClaimContent,
  TicketClaimLogo,
  TicketClaimMessage,
} from '~/components/LaunchWeek/14/TicketClaim'
import { ActionButton } from '~/components/LaunchWeek/14/ActionButton'
import { usePartymode } from '~/components/LaunchWeek/14/hooks/use-partymode'
import { TicketShareLayout } from '~/components/LaunchWeek/14/TicketShareLayout'
import TicketCopy from '~/components/LaunchWeek/14/TicketCopy'
import TicketShare from '~/components/LaunchWeek/14/TicketShare'
import { useRegistration } from '~/components/LaunchWeek/14/hooks/use-registration'
import useConfData from './hooks/use-conf-data'
import SectionContainerWithCn from '~/components/Layouts/SectionContainerWithCn'

const dates = [new Date('2025-03-31T07:00:00.000-08:00')]

export const LwView = () => {
  const partymode = usePartymode()

  const [state] = useConfData()
  const register = useRegistration()

  return (
    <DefaultLayout className='font-["Departure_Mono"]'>
      <SectionContainerWithCn id="ticket" height="none" width="smallScreenFull">
        <TicketLayout>
          <TicketHeader>
            <TicketHeaderRemainingTime targetDate={dates[0]} />
            <TicketHeaderClaim />
            <TicketHeaderDate />
          </TicketHeader>
          <TicketLayoutCanvas>
            <TicketCanvas onUpgradeToSecret={register.upgradeTicket} />
            {state.claimFormState === 'visible' && (
              <TicketClaim>
                <TicketClaimLogo />
                <TicketClaimContent>
                  <TicketClaimMessage />
                  <TicketClaimButtons>
                    <ActionButton variant="primary" icon="T" onClick={() => register.signIn()}>
                      CLAIM YOUR TICKET
                    </ActionButton>
                    <ActionButton
                      variant={state.partymodeStatus === 'on' ? 'primary' : 'secondary'}
                      icon="P"
                      onClick={() => {
                        partymode.toggle()
                      }}
                    >
                      Party mode: {state.partymodeStatus === 'on' ? 'ON' : 'OFF'}
                    </ActionButton>
                  </TicketClaimButtons>
                </TicketClaimContent>
              </TicketClaim>
            )}
            {state.ticketVisibility && (
              <>
                <TicketShareLayout>
                  <TicketCopy />
                  <TicketShare />
                </TicketShareLayout>

                <div className="absolute bottom-4 md:bottom-auto md:top-4 xl:top-6 2xl:top-8 left-0 right-0 flex justify-center">
                  <ActionButton
                    variant={state.partymodeStatus === 'on' ? 'primary' : 'secondary'}
                    icon="P"
                    onClick={() => {
                      partymode.toggle()
                    }}
                  >
                    Party mode: {state.partymodeStatus === 'on' ? 'ON' : 'OFF'}
                  </ActionButton>
                </div>
              </>
            )}
          </TicketLayoutCanvas>
        </TicketLayout>
      </SectionContainerWithCn>
    </DefaultLayout>
  )
}
