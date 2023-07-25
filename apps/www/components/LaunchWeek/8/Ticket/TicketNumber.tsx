import styles from './ticket.module.css'

type Props = {
  number: number | undefined
  golden?: boolean
}

export default function TicketNumber({ number, golden = false }: Props) {
  const numDigits = `${number}`.length
  const prefix = `00000000`.slice(numDigits)
  const ticketNumberText = `NO ${prefix}${number}`

  return (
    <>
      <div className="z-10 mt-2 md:mt-0 md:absolute md:flex inset-0 items-center justify-center top-auto md:left-auto md:right-0 md:top-0 md:w-[90px] md:h-100% dark:text-white">
        <span
          className={[
            `
            md:absolute text-[16px] md:text-[22px] w-full px-2 py-8 md:w-[max-content] leading-[1]
            md:transform md:-rotate-90 md:origin-center
            text-scale-1100 text-center font-mono tracking-[0.8rem]
          `,
            golden ? styles['ticket-number-gold'] : styles['ticket-number'],
          ].join(' ')}
        >
          {ticketNumberText}
        </span>
      </div>
    </>
  )
}
