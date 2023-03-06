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
    <>
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
        <TicketHeader />
        <div className={cn(styles['horizontal-ticket'])} id="wayfinding--TicketMono-container">
          <TicketMono golden={golden} />
        </div>
        <div className={styles['vertical-ticket']}>
          <TicketMonoMobile golden={golden} />
        </div>

        <div
          className="absolute top-[90px] lg:-translate-y-1/2  w-full lg:top-1/2 flex justify-center"
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
        <TicketNumber number={ticketNumber} />
      </div>
    </>
  )
}
