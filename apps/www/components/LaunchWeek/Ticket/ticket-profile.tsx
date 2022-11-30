// import GithubIcon from '~/components/LaunchWeek/Ticket/icons/icon-github'
import cn from 'classnames'
// import IconAvatar from '~/components/LaunchWeek/Ticket/icons/icon-avatar'
import styles from './ticket-profile.module.css'

type TicketGenerationState = 'default' | 'loading'
type Props = {
  name?: string
  username?: string
  size?: number
  ticketGenerationState: TicketGenerationState
  golden?: boolean
}

export default function TicketProfile({
  name,
  username,
  size = 1,
  ticketGenerationState,
  golden = false,
}: Props) {
  return (
    <div className={styles.profile}>
      <span
        className={cn(styles.skeleton, styles.wrapper, styles.inline, styles.rounded, {
          [styles.show]: ticketGenerationState === 'loading',
        })}
      >
        {username ? (
          <img src={`https://github.com/${username}.png`} alt={username} className={styles.image} />
        ) : (
          <span
            className={cn(
              styles.image,
              golden ? styles['empty-icon--golden'] : styles['empty-icon']
            )}
          >
            {/* <IconAvatar /> */}
          </span>
        )}
      </span>
      <div className={styles.text}>
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
            } from-white via-white bg-clip-text text-transparent`}
          >
            {name || username || 'Your Name'}
          </span>
        </p>
        <p className={cn(styles.username, { [styles['username-golden']]: golden })}>
          <span
            className={cn(styles.skeleton, styles.wrapper, {
              [styles.show]: ticketGenerationState === 'loading',
            })}
          >
            <span className={`${golden ? 'text-white' : 'text-scale-1100'}`}>
              {/* <GithubIcon
                color={golden ? 'var(--gold-primary)' : 'var(--secondary-color)'}
                size={20 * size}
              /> */}
              {username ? `@${username}` : <>username</>}
            </span>

            <img
              alt="Supabase disconnected badge"
              src={`/images/launchweek/supabadge-${
                golden ? 'gold' : username ? 'connected' : 'disconnected'
              }.svg`}
              className="ml-2"
            />
          </span>
        </p>
      </div>
    </div>
  )
}
