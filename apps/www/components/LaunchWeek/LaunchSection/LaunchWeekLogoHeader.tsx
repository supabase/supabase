import classNames from 'classnames'
import styleUtils from '~/components/LaunchWeek/Ticket/utils.module.css'
import Image from 'next/image'

export function LaunchWeekLogoHeader() {
  return (
    <div className="flex flex-col gap-3 items-center justify-center xl:justify-start">
      <div
        className={classNames(
          styleUtils.appear,
          styleUtils['appear-first'],
          'flex flex-col justify-center gap-3'
        )}
      >
        <h1 className="flex gap-[24px] justify-center font-normal uppercase text-[32px] items-center">
          <span className="tracking-[4px] text-white">Launch week</span>
          <span className="flex justify-center">
            <Image src="/images/launchweek/seven/lw7-seven.svg" width={40} height={40} />
          </span>
        </h1>
        <p className="text-white text-sm text-center">April 3rd – 7th at 6 AM PT | 9 AM ET</p>
      </div>
    </div>
  )
}
