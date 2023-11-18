type Props = {
  number: number | undefined
  golden?: boolean
}

export default function TicketNumber({ number, golden = false }: Props) {
  const numDigits = `${number}`.length
  const prefix = `00000000`.slice(numDigits)
  const ticketNumberText = `NO ${prefix}${number}`

  return (
    <span className="w-[max-content] leading-[1] text-foreground-light text-center font-mono tracking-[0.8rem]">
      {ticketNumberText}
    </span>
  )
}
