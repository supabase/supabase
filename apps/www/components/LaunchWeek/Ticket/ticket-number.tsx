type Props = {
  number: number
}

export default function TicketNumber({ number }: Props) {
  const numDigits = `${number}`.length
  const prefix = `000000`.slice(numDigits)
  return (
    <>
      № {prefix}
      {number}
    </>
  )
}
