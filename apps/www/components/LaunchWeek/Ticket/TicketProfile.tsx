// import GithubIcon from '~/components/LaunchWeek/Ticket/icons/icon-github'
import cn from 'classnames'
import TicketForm from './TicketForm'
// import IconAvatar from '~/components/LaunchWeek/Ticket/icons/icon-avatar'
import styles from './ticket-profile.module.css'

type TicketGenerationState = 'default' | 'loading'
type Props = {
  name?: string
  username?: string
  size?: number
  ticketGenerationState: TicketGenerationState
  setTicketGenerationState: (ticketGenerationState: TicketGenerationState) => void
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
    <div className="grid items-center justify-center" id="wayfinding--ticket-middle">
      {username && (
        <span
          className={cn('rounded-full inline-block mx-auto', styles.wrapper, styles.rounded, {
            [styles.show]: ticketGenerationState === 'loading',
          })}
        >
          {username ? (
            <img
              src={`https://github.com/${username}.png`}
              alt={username}
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
      <div className={styles.text}>
        {username ? (
          <p
            className={`${cn(
              styles.name,
              { [styles['name-blank']]: !username },
              { [styles['name-golden']]: golden }
            )} dark:text-white`}
          >
            <span
              className={`${cn(styles.skeleton, styles.wrapper, {
                [styles.show]: ticketGenerationState === 'loading',
              })} text-4xl bg-gradient-to-r ${
                golden ? 'to-[#ffe8af]' : 'to-slate-900'
              } from-white via-white bg-clip-text text-transparent text-center`}
            >
              {name || username || 'Your Name'}
            </span>
          </p>
        ) : (
          <TicketForm
            defaultUsername={username ?? undefined}
            setTicketGenerationState={setTicketGenerationState}
          />
        )}

        <div
          className={cn(styles.username, { [styles['username-golden']]: golden })}
          id="wayfinder--username--container"
        >
          <p className="text-center w-full">
            <span
              className={`${golden ? 'text-white' : 'text-scale-1100'}`}
              id="wayfinding--twitter-handle"
            >
              {/* <GithubIcon
                color={golden ? 'var(--gold-primary)' : 'var(--secondary-color)'}
                size={20 * size}
              /> */}
              {username ? `@${username}` : ''}
            </span>
            {/* {username && (
              <img
                alt="Supabase disconnected badge"
                src={`/images/launchweek/supabadge-${
                  golden ? 'gold' : username ? 'connected' : 'disconnected'
                }.svg`}
                className="ml-2"
              />
            )} */}
          </p>
        </div>
      </div>
    </div>
  )
}
