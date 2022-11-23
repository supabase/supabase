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
          <span className={cn(styles.image, styles['empty-icon'])}>{/* <IconAvatar /> */}</span>
        )}
      </span>
      <div className={styles.text}>
        <p
          className={cn(
            styles.name,
            { [styles['name-blank']]: !username },
            { [styles['name-golden']]: golden }
          )}
        >
          <span
            className={cn(styles.skeleton, styles.wrapper, {
              [styles.show]: ticketGenerationState === 'loading',
            })}
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
            <span className={cn(styles.githubIcon, { [styles['githubIcon-golden']]: golden })}>
              {/* <GithubIcon
                color={golden ? 'var(--gold-primary)' : 'var(--secondary-color)'}
                size={20 * size}
              /> */}
            </span>
            {username || <>username</>}
          </span>
        </p>
      </div>
    </div>
  )
}
