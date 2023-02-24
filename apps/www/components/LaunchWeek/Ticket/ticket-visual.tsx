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
  // golden = true

  const router = useRouter()
  const basePath = router.basePath

  return (
    <>
      <div
        className={[
          styles.visual,
          golden ? styles['visual--gold'] : '',
          'wayfinding--ticket-visual-inner-container',
        ].join(' ')}
        style={{
          ['--size' as string]: size,
        }}
      >
        <div className={cn(styles['horizontal-ticket'], 'wayfinding--TicketMono-container')}>
          <TicketMono golden={golden} />
        </div>

        <div className={styles['vertical-ticket']}>
          <TicketMonoMobile golden={golden} />
        </div>

        <div className={styles.logo}>
          <img src={`/images/launchweek/ticket-logo-${golden ? 'light' : 'dark'}.svg`} />
        </div>

        <div className={`${styles.profile} wayfinding--TicketProfile-container`}>
          <TicketProfile
            name={name}
            username={username}
            size={size}
            ticketGenerationState={ticketGenerationState}
            golden={golden}
          />
        </div>
        <div className={`${styles.info} wayfinding--TicketInfo-container`}>
          <TicketInfo
            golden={golden}
            logoTextSecondaryColor={
              ticketNumber ? (golden ? '#F2C94C' : 'var(--brand)') : undefined
            }
          />
        </div>
        {ticketNumber && (
          <div className={`${styles['ticket-number-wrapper']} dark:text-white`}>
            <div
              className={`${cn(styles['ticket-number'], {
                [styles['ticket-number-golden']]: golden,
              })} bg-gradient-to-r  from-white via-white wayfinding--ticket-number ${
                golden ? 'to-[#ffe8af]' : 'to-slate-900'
              }`}
            >
              <TicketNumber number={ticketNumber} />
            </div>
          </div>
        )}
      </div>
    </>
  )
}
