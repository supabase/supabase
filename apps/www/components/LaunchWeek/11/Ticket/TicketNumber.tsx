import { cn } from 'ui'

type Props = {
  number: number | undefined
  secret?: boolean
  platinum?: boolean
  className?: string
}

export default function TicketNumber({
  number,
  platinum = false,
  secret = false,
  className,
}: Props) {
  const numDigits = `${number}`.length
  const prefix = `0000000`.slice(numDigits)
  const ticketNumberText = `NO ${prefix}${number}`

  return (
    <span
      className={cn(
        'w-[max-content] leading-[1] font-mono tracking-[.15rem] text-sm',
        secret ? 'text-[#8b818c]' : platinum ? 'text-[#999a9b]' : 'text-[#616464]',
        className
      )}
    >
      {ticketNumberText}
    </span>
  )
}
