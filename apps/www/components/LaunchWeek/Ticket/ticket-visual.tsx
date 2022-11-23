import styles from './ticket-visual.module.css'
import TicketProfile from './ticket-profile'
import TicketNumber from './ticket-number'
import TicketMono from './ticket-mono'
import TicketInfo from './ticket-info'
import TicketMonoMobile from './ticket-mono-mobile'
import cn from 'classnames'
import { useRouter } from 'next/router'

type TicketGenerationState = 'default' | 'loading'
type Props = {
  size?: number
  name?: string
  ticketNumber?: number
  username?: string
  ticketGenerationState?: TicketGenerationState
  golden?: boolean
}

export default function TicketVisual({
  size = 1,
  name,
  username,
  ticketNumber,
  ticketGenerationState = 'default',
  golden = false,
}: Props) {
  // golden = true;

  const router = useRouter()
  const basePath = router.basePath
  return (
    <>
      <div
        className={[styles.visual, golden ? styles['visual--gold'] : ''].join(' ')}
        style={{ ['--size' as string]: size }}
      >
        <div className={styles['horizontal-ticket']}>
          {/* {username ? <TicketColored golden={golden} /> : <TicketMono golden={golden} />} */}

          <TicketMono golden={golden} />
        </div>
        <div className={styles['vertical-ticket']}>
          {/* {username ? (
            <TicketColoredMobile golden={golden} />
          ) : (
            <TicketMonoMobile golden={golden} />
          )} */}
          <TicketMonoMobile golden={golden} />
        </div>
        <div className={styles.logo}>
          <img src="/images/launchweek/launchweek-logo--dark.svg" />
        </div>
        <div className={styles.profile}>
          <TicketProfile
            name={name}
            username={username}
            size={size}
            ticketGenerationState={ticketGenerationState}
            golden={golden}
          />
        </div>
        <div className={styles.info}>
          <TicketInfo
            golden={golden}
            logoTextSecondaryColor={
              ticketNumber ? (golden ? '#F2C94C' : 'var(--brand)') : undefined
            }
          />
        </div>
        {ticketNumber && (
          <div className={styles['ticket-number-wrapper']}>
            <div
              className={cn(styles['ticket-number'], { [styles['ticket-number-golden']]: golden })}
            >
              <TicketNumber number={ticketNumber} />
            </div>
          </div>
        )}
      </div>
    </>
  )
}
