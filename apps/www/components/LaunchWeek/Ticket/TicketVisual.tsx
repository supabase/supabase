import styles from './ticket-visual.module.css'
import TicketProfile from './TicketProfile'
import TicketNumber from './TicketNumber'
import TicketMono from './ticket-mono'
import TicketInfoFooter from './ticket-info-footer'
import TicketMonoMobile from './ticket-mono-mobile'
import cn from 'classnames'
import { useRouter } from 'next/router'
import { DATE } from '~/lib/constants'
import useConfData from '~/components/LaunchWeek/Ticket/hooks/use-conf-data'
import TicketHeader from './TicketHeader'

type TicketGenerationState = 'default' | 'loading'
type Props = {
  size?: number
  name?: string
  ticketNumber?: number
  username?: string
  ticketGenerationState?: TicketGenerationState
  setTicketGenerationState?: any
  golden?: boolean
}

export default function TicketVisual({
  size = 1,
  name,
  username,
  ticketNumber,
  ticketGenerationState = 'default',
  setTicketGenerationState,
  golden = false,
}: Props) {
  const { session } = useConfData()
  // golden = true

  const router = useRouter()
  const basePath = router.basePath

  return (
    <div
      className={[
        styles.visual,
        golden ? styles['visual--gold'] : '',
        session ? styles['visual--logged-in'] : '',
        'flex relative flex-col flex-1 justify-between rounded-xl bg-black w-full h-full box-border',
      ].join(' ')}
      style={{
        ['--size' as string]: size,
      }}
      id="wayfinding--ticket-visual-inner-container"
    >
      <div className="flex flex-col items-center justify-between w-full h-full flex-1 md:pr-[110px]">
        {username && <TicketHeader />}
        <div
          className="flex-1 w-full h-full md:h-auto flex flex-col justify-center"
          id="wayfinding--TicketProfile-container"
        >
          <TicketProfile
            name={name}
            username={username}
            size={size}
            ticketGenerationState={ticketGenerationState}
            setTicketGenerationState={setTicketGenerationState}
            golden={golden}
          />
        </div>
      </div>
      <TicketNumber number={ticketNumber} />
      <div className="hidden md:flex absolute inset-0" id="wayfinding--TicketMono-container">
        <TicketMono golden={golden} />
      </div>
      <div className="flex md:hidden absolute inset-0">
        <TicketMonoMobile golden={golden} />
      </div>
    </div>
  )
}
