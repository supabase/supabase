import React from 'react'

type HamburgerButtonProps = {
  toggleFlyOut: Function
  showLaunchWeekNavMode?: boolean
}

const HamburgerButton = (props: HamburgerButtonProps) => (
  <div
    className="absolute inset-y-0 left-0 flex items-center px-4 lg:hidden"
    onClick={() => props.toggleFlyOut()}
  >
    <button
      className={[
        'text-scale-900 focus:ring-brand dark:bg-scale-200 dark:hover:bg-scale-300 inline-flex items-center justify-center rounded-md bg-gray-50 p-2 hover:bg-white focus:outline-none focus:ring-2 focus:ring-inset',
        props.showLaunchWeekNavMode && '!bg-transparent border border-[#be9eea]',
      ].join(' ')}
      aria-expanded="false"
    >
      <span className="sr-only">Open main menu</span>

      <svg
        className="block w-6 h-6"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke={props.showLaunchWeekNavMode ? '#be9eea' : 'currentColor'}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>

      <svg
        className="hidden w-6 h-6"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  </div>
)

export default HamburgerButton
