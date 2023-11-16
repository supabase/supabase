// import GithubIcon from '~/components/LaunchWeek/Ticket/icons/icon-github'
import cn from 'classnames'
import TicketForm from './TicketForm'
// import IconAvatar from '~/components/LaunchWeek/Ticket/icons/icon-avatar'
import styles from './ticket-profile.module.css'
import Image from 'next/image'

type TicketGenerationState = 'default' | 'loading'
type Props = {
  name?: string
  username?: string
  size?: number
  ticketGenerationState?: TicketGenerationState
  setTicketGenerationState?: (ticketGenerationState: TicketGenerationState) => void
  golden?: boolean
}

// The middle part of the ticket
// avatar / Yourn Name / Username
export default function TicketProfile({
  name,
  username,
  size = 1,
  ticketGenerationState,
  setTicketGenerationState,
  golden = false,
}: Props) {
  return (
    <div className="grid gap-4 items-center justify-center px-2" id="wayfinding--ticket-middle">
      {username && (
        <span
          className={cn('rounded-full inline-block mx-auto', styles.wrapper, styles.rounded, {
            [styles.show]: ticketGenerationState === 'loading',
          })}
        >
          {username ? (
            <Image
              src={`https://github.com/${username}.png`}
              alt={username}
              layout="fill"
              objectFit="contain"
              priority
              className={styles.image}
            />
          ) : (
            <>
              {/* <span
            className={cn(
              styles.image,
              golden ? styles['empty-icon--golden'] : styles['empty-icon']
              )}
              >
             { <IconAvatar />}
          </span> */}
            </>
          )}
        </span>
      )}
      <div>
        {username ? (
          <p
            className={`${cn(
              styles.name,
              { [styles['name-blank']]: !username },
              { [styles['name-golden']]: golden }
            )} text-foreground text-center`}
          >
            <div
              className={`${cn(styles.skeleton, styles.wrapper, {
                [styles.show]: ticketGenerationState === 'loading',
              })} text-3xl sm:text-4xl bg-gradient-to-r from-[#F8F9FA] via-[#F8F9FA] to-[#F8F9FA60] bg-clip-text text-transparent text-center`}
            >
              {name || username || 'Your Name'}
              <p>{name && <p className="gradient-text-100 text-sm">@{username}</p>}</p>
            </div>
          </p>
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
