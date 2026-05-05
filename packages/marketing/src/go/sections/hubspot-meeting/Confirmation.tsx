import type { BookingConfirmation } from './types'

interface ConfirmationProps {
  confirmation: BookingConfirmation
  timezone: string
}

export default function Confirmation({ confirmation, timezone }: ConfirmationProps) {
  const startDate = new Date(confirmation.start)
  const endDate = new Date(confirmation.end)

  const dateLabel = startDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: timezone,
  })

  const timeLabel = `${startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone,
  })} – ${endDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone,
  })}`

  return (
    <div className="w-full text-center flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-brand-500/10 flex items-center justify-center">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 6L9 17L4 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-brand-500"
          />
        </svg>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-foreground text-lg font-medium">Meeting confirmed</h3>
        <p className="text-foreground-lighter text-sm">
          You'll receive a calendar invitation at your email.
        </p>
      </div>

      <div className="bg-surface-100 border border-muted rounded-lg px-6 py-4 flex flex-col gap-1 w-full max-w-sm">
        <p className="text-foreground font-medium text-sm">{dateLabel}</p>
        <p className="text-foreground-lighter text-sm">{timeLabel}</p>
        {confirmation.location && (
          <p className="text-foreground-lighter text-sm mt-1">{confirmation.location}</p>
        )}
      </div>
    </div>
  )
}
