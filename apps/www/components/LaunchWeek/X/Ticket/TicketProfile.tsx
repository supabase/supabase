import { UserData } from '../../hooks/use-conf-data'

type TicketGenerationState = 'default' | 'loading'
type Props = {
  user: UserData
  ticketGenerationState?: TicketGenerationState
  setTicketGenerationState?: (ticketGenerationState: TicketGenerationState) => void
  golden?: boolean
}

export default function TicketProfile({ user, ticketGenerationState, golden = false }: Props) {
  const { username, name, metadata } = user

  const HAS_ROLE = !!metadata?.role
  const HAS_COMPANY = !!metadata?.company
  const HAS_LOCATION = !!metadata?.location
  const HAS_NO_META = !HAS_ROLE && !HAS_COMPANY && !HAS_LOCATION

  return (
    <div className="relative z-10 flex gap-4 items-center">
      <div className="text-foreground-light text-center items-center flex flex-col gap-1">
        <p className="text-xl text-foreground leading-none">{name || username || 'Your Name'}</p>
        {HAS_NO_META && username && <p>@{username}</p>}
        <div>
          {HAS_ROLE && <span>{metadata?.role}</span>}
          {HAS_COMPANY && (
            <span>
              {HAS_ROLE && ' '}
              <span>at</span> {metadata?.company}
            </span>
          )}
          {HAS_LOCATION && (
            <span>
              {' '}
              {(HAS_ROLE || HAS_COMPANY) && '—'} {metadata?.location}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
