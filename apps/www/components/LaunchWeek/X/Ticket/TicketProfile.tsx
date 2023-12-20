import { cn } from 'ui'
import useConfData from '~/components/LaunchWeek/hooks/use-conf-data'

export default function TicketProfile() {
  const { userData: user } = useConfData()
  const { username, name, metadata, golden } = user
  const hasLightTicket = golden || metadata?.hasSecretTicket

  const HAS_ROLE = !!metadata?.role
  const HAS_COMPANY = !!metadata?.company
  const HAS_NO_META = !HAS_ROLE && !HAS_COMPANY

  return (
    <div className="relative z-10 flex gap-4">
      <div
        className={cn(
          'text-foreground-light flex flex-col gap-1 text-left text-xl md:max-w-[300px] mb-8',
          hasLightTicket ? 'text-[#7E868C]' : 'text-[#8B9092]'
        )}
      >
        <p
          className={cn(
            'text-2xl text-foreground leading-[105%]',
            hasLightTicket ? 'text-[#11181C]' : 'text-white'
          )}
        >
          {name || username || 'Your Name'}
        </p>
        {HAS_NO_META && username && <p className="text-foreground-lighter">@{username}</p>}
        <div>
          {HAS_ROLE && <span>{metadata?.role}</span>}
          {HAS_COMPANY && (
            <span>
              {HAS_ROLE && <span> at </span>}
              {metadata?.company}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
