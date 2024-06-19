type Props = {
  number: number | undefined
  size?: 'default' | 'small'
}

export default function TicketNumber({ number, size }: Props) {
  const numDigits = `${number}`.length
  const prefix = `00000000`.slice(numDigits)
  const ticketNumberText = `№ ${prefix}${number}`

  return (
    <>
      <div
        className="z-10 absolute md:flex inset-0 top-auto md:left-auto md:right-0 md:top-0 md:w-[110px] md:h-100% text-foreground"
        id="wayfinding--ticket-number-outer"
      >
        <div
          className={[
            'flex flex-col md:flex-row items-center justify-center w-full text-center',
            size === 'small' ? 'text-[20px]' : 'text-[32px] md:text-[42px] ',
          ].join(' ')}
          id="wayfinding--ticket-number-inner"
        >
          {/* Mobile line */}
          <div className="block md:hidden">
            <svg
              width="234"
              height="2"
              viewBox="0 0 234 2"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0.0390625 1L233.294 0.99999"
                stroke="url(#paint0_linear_1701_100991)"
                strokeWidth="0.71381"
                strokeDasharray="1.43 1.43"
              />
              <defs>
                <linearGradient
                  id="paint0_linear_1701_100991"
                  x1="0.0390625"
                  y1="0.5"
                  x2="233.294"
                  y2="0.49999"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="white" stopOpacity="0" />
                  <stop offset="0.53125" stopColor="white" />
                  <stop offset="1" stopColor="white" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          {/* Vertical line: desktop */}
          <div
            className="h-full hidden md:flex items-center absolute left-0"
            id="wayfinding--ticket-stitch"
          >
            <svg
              width="2"
              height={size === 'small' ? '210' : '328'}
              viewBox="0 0 2 328"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0.601562 0.988281V327.763"
                stroke="url(#paint0_linear_1736_81388)"
                strokeDasharray="2 2"
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
                  <stop stopColor="white" stopOpacity="0" />
                  <stop offset="0.53125" stopColor="white" />
                  <stop offset="1" stopColor="white" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="md:absolute px-2 py-8 md:w-[max-content] leading-[1] md:transform md:rotate-90 md:origin-center bg-gradient-to-r from-[#F8F9FA] via-[#F8F9FA] to-[#F8F9FA50] bg-clip-text text-[#F8F9FA50] text-center">
            {ticketNumberText}
          </div>
        </div>
      </div>
    </>
  )
}
