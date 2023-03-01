type Props = {
  number: number | undefined
}

export default function TicketNumber({ number }: Props) {
  const numDigits = `${number}`.length
  const prefix = `00000000`.slice(numDigits)
  return (
    <>
      <div
        className="absolute bottom-10 lg:bottom-0 right-24 dark:text-white"
        id="wayfinding--ticket-number-outer"
      >
        <div
          className="text-[42px] leading-[1] w-[370px] text-center bg-clip-text lg:transform lg:rotate-90 lg:translate-y-100 origin-bottom-right bg-gradient-to-r from-white via-white"
          id="wayfinding--ticket-number-inner"
        >
          № {prefix}
          {number}
        </div>
      </div>
      <div className="absolute right-28 top-3 w-4 h-[290px]" id="wayfinding--ticket-stitch">
        <svg
          width="2"
          height="328"
          viewBox="0 0 2 328"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0.601562 0.988281V327.763"
            stroke="url(#paint0_linear_1736_81388)"
            stroke-dasharray="2 2"
          />
          <defs>
            <linearGradient
              id="paint0_linear_1736_81388"
              x1="1.10156"
              y1="0.988281"
              x2="1.10156"
              y2="327.763"
              gradientUnits="userSpaceOnUse"
            >
              <stop stop-color="white" stop-opacity="0" />
              <stop offset="0.53125" stop-color="white" />
              <stop offset="1" stop-color="white" stop-opacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </>
  )
}
