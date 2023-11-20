type Props = {
  number: number | undefined
  golden?: boolean
}

export default function TicketNumber({ number, golden = false }: Props) {
  const numDigits = `${number}`.length
  const prefix = `00000000`.slice(numDigits)
  const ticketNumberText = `NO ${prefix}${number}`

  return (
    // [text-shadow:_0_0_2px_rgb(255_255_255_/_50%)]
    <span className="w-[max-content] leading-[1] text-foreground-lighter">{ticketNumberText}</span>
  )
}
