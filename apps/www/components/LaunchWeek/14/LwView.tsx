import TicketCanvas from '~/components/LaunchWeek/14/TicketCanvas'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
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
import { TicketShare } from '~/components/LaunchWeek/14/TicketShare'
import TicketCopy from '~/components/LaunchWeek/14/TicketCopy'
import TicketActions from '~/components/LaunchWeek/14/TicketActions'
import { useRegistration } from '~/components/LaunchWeek/14/hooks/use-registration'
import useConfData from './hooks/use-conf-data'

const dates = [new Date('2025-03-31T07:00:00.000-07:00')]

export const LwView = () => {
  const partymode = usePartymode()

  const [state] = useConfData()

  const register = useRegistration()

  return (
    <DefaultLayout className='font-["Departure_Mono"]'>
      <SectionContainer id="ticket" className="relative !max-w-none lw-nav-anchor">
        <TicketLayout>
          <TicketHeader>
            <TicketHeaderRemainingTime targetDate={dates[0]} />
            <TicketHeaderClaim />
            <TicketHeaderDate />
          </TicketHeader>
          <TicketLayoutCanvas>
            <TicketCanvas />
            {state.claimFormState === 'visible' && (
              <TicketClaim>
                <TicketClaimLogo />
                <TicketClaimContent>
                  <TicketClaimMessage />
                  <TicketClaimButtons>
                    <ActionButton
                      variant="primary"
                      icon="T"
                      onClick={() => register.signIn()}
                    >
                      CLAIM YOUR TICKET
                    </ActionButton>
                    <ActionButton
                      variant={partymode.state.on ? 'primary' : 'secondary'}
                      icon="P"
                      onClick={() => {
                        partymode.toggle()
                      }}
                    >
                      Party mode: {partymode.state.on ? 'ON' : 'OFF'}
                    </ActionButton>
                  </TicketClaimButtons>
                </TicketClaimContent>
              </TicketClaim>
            )}
            {state.ticketVisibility && (
              <TicketShare>
                <TicketCopy />
                <TicketActions />
              </TicketShare>
            )}
          </TicketLayoutCanvas>
        </TicketLayout>
      </SectionContainer>
    </DefaultLayout>
  )
}
