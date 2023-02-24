type Props = {
  number: number
}

export default function TicketNumber({ number }: Props) {
  const numDigits = `${number}`.length
  const prefix = `00000000`.slice(numDigits)
  return (
    <div
      className="absolute bottom-10 lg:bottom-0 right-24 dark:text-white"
      id="wayfinding--ticket-number-outer"
    >
      <div
        className="text-4xl leading-[1] w-[380px] text-center bg-clip-text lg:transform lg:rotate-90 lg:translate-y-100 origin-bottom-right bg-gradient-to-r  from-white via-white"
        id="wayfinding--ticket-number-inner"
      >
        № {prefix}
        {number}
      </div>
    </div>
  )
}
