import TicketCanvas from '~/components/LaunchWeek/14/TicketCanvas'
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
import { TicketShareLayout } from '~/components/LaunchWeek/14/TicketShareLayout'
import TicketCopy from '~/components/LaunchWeek/14/TicketCopy'
import TicketShare from '~/components/LaunchWeek/14/TicketShare'
import { useRegistration } from '~/components/LaunchWeek/14/hooks/use-registration'
import useConfData from './hooks/use-conf-data'
import SectionContainerWithCn from '~/components/Layouts/SectionContainerWithCn'

const dates = [new Date('2025-03-31T07:00:00.000-08:00')]

export const LwView = () => {
  const [state] = useConfData()
  const register = useRegistration()

  return (
      <SectionContainerWithCn id="ticket" height="none" width="smallScreenFull">
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
                <TicketClaimLogo />
                <TicketClaimContent>
                  <TicketClaimMessage />
                  <TicketClaimButtons>
                    <ActionButton variant="primary" icon="T" onClick={() => register.signIn()}>
                      CLAIM YOUR TICKET
                    </ActionButton>
                  </TicketClaimButtons>
                </TicketClaimContent>
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
          </TicketLayoutCanvas>
        </TicketLayout>
      </SectionContainerWithCn>
  )
}
