import styles from './ticket-visual.module.css'
import TicketProfile from './TicketProfile'
import TicketNumber from './TicketNumber'
import { UserData } from '~/components/LaunchWeek/hooks/use-conf-data'
import TicketHeader from './TicketHeader'
import Image from 'next/image'
import TicketForm from './TicketForm'
import TicketFooter from './TicketFooter'
import { cn } from 'ui'

type TicketGenerationState = 'default' | 'loading'
type Props = {
  user: UserData
  ticketGenerationState?: TicketGenerationState
  setTicketGenerationState?: any
}

export default function Ticket({
  user,
  ticketGenerationState = 'default',
  setTicketGenerationState,
}: Props) {
  const { username, golden = false, bg_image_id: bgImageId, ticketNumber } = user

  const ticketBg = {
    regular: {
      background: `/images/launchweek/8/ticket-bg/regular.png`,
    },
    golden: {
      background: `/images/launchweek/8/ticket-bg/golden.png`,
    },
  }

  const CURRENT_TICKET = golden ? 'golden' : 'regular'
  const CURRENT_TICKET_BG = ticketBg[CURRENT_TICKET].background

  return (
    <div className="flex relative flex-col w-[300px] h-auto md:w-full md:max-w-none backdrop-blur-md">
      <div
        className={cn(
          'flex relative flex-col justify-between w-full aspect-[1/1.6] md:aspect-[1.935/1] rounded-xl border'
        )}
      >
        {username ? (
          <div className="absolute inset-0 h-full px-4 pb-6 z-10 flex flex-col items-center justify-between w-full md:h-full flex-1 md:pb-0 md:pl-8 md:pr-[15%] overflow-hidden">
            <TicketHeader golden={golden} />
            <div className="flex-1 w-full h-full md:h-auto flex py-6 md:py-4 flex-col justify-center">
              <TicketProfile
                user={user}
                ticketGenerationState={ticketGenerationState}
                setTicketGenerationState={setTicketGenerationState}
                golden={golden}
              />
            </div>
            <TicketFooter />
            <TicketNumber number={ticketNumber} golden={golden} />
            <div className="absolute z-500 inset-0 overflow-hidden rounded-xl">
              <Image
                src={CURRENT_TICKET_BG}
                alt="ticket background"
                layout="fill"
                objectFit="cover"
                objectPosition="center"
                quality={100}
              />
            </div>
          </div>
        ) : (
          <TicketForm
            defaultUsername={username ?? undefined}
            setTicketGenerationState={setTicketGenerationState}
          />
        )}
      </div>
    </div>
  )
}
