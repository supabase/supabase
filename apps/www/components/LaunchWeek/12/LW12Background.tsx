import React from 'react'
import { cn } from 'ui'
import { range } from 'lodash'

interface Props {
  className?: string
}

const LW12Background = ({ className }: Props) => {
  return (
    <div className={cn('absolute inset-0 w-full h-full flex flex-col', className)}>
      {range(0, 3).map((_) => (
        <div className="w-fit h-full max-h-full flex flex-col gap-0 animate-marquee-vertical will-change-transform mx-auto">
          <img
            src="/images/launchweek/12/bg-light.svg"
            className="dark:hidden block relative inset-0 w-full overflow-hidden object-cover"
          />
          <img
            src="/images/launchweek/12/bg-dark.svg"
            className="dark:block hidden relative inset-0 w-full overflow-hidden object-cover"
          />
          {/* <img
            src="/images/launchweek/12/bg-light.svg"
            className="dark:hidden block relative inset-0 w-full overflow-hidden object-cover"
          />
          <img
            src="/images/launchweek/12/bg-dark.svg"
            className="dark:block hidden relative inset-0 w-full overflow-hidden object-cover"
          />
          <img
            src="/images/launchweek/12/bg-light.svg"
            className="dark:hidden block relative inset-0 w-full overflow-hidden object-cover"
          />
          <img
            src="/images/launchweek/12/bg-dark.svg"
            className="dark:block hidden relative inset-0 w-full overflow-hidden object-cover"
          /> */}
        </div>
      ))}
    </div>
  )
}

export default LW12Background
