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
  const prefix = `00000000`.slice(numDigits)
  const ticketNumberText = `NO ${prefix}${number}`

  return (
    // [text-shadow:_0_0_2px_rgb(255_255_255_/_50%)]
    <span
      className={cn(
        'w-[max-content] leading-[1] font-mono tracking-[.15rem] text-xs',
        secret ? 'text-[#8b818c]' : platinum ? 'text-[#999a9b]' : 'text-[#545758]',
        className
      )}
    >
      {ticketNumberText}
    </span>
  )
}
