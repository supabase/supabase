type Props = {
  number: number | undefined
  size?: 'default' | 'small'
}

export default function TicketNumber({ number, size }: Props) {
  const numDigits = `${number}`.length
  const prefix = `00000000`.slice(numDigits)
  return (
    <>
      <div
        className={[
          'absolute bottom-10 lg:bottom-0  dark:text-white',
          size === 'small' ? 'right-12' : 'right-24',
        ].join(' ')}
        id="wayfinding--ticket-number-outer"
      >
        <div
          className={[
            'leading-[1] w-[370px] text-center bg-clip-text lg:transform lg:rotate-90 lg:translate-y-100 origin-bottom-right bg-gradient-to-r from-white via-white',
            size === 'small' ? 'text-[20px] w-[220px]' : 'text-[20px] lg:text-[42px] ',
          ].join(' ')}
          id="wayfinding--ticket-number-inner"
        >
          № {prefix}
          {number}
        </div>
      </div>
      <div
        className={[
          'absolute top-3 w-4',
          size === 'small' ? 'h-[200px] right-12' : 'h-[290px] right-28',
        ].join(' ')}
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
    </>
  )
}
