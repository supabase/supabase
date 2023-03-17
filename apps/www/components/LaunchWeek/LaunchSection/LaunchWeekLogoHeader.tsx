import classNames from 'classnames'
import styleUtils from '~/components/LaunchWeek/Ticket/utils.module.css'
import Image from 'next/image'
import { motion } from 'framer-motion'

export function LaunchWeekLogoHeader() {
  return (
    <div className="flex flex-col gap-1 lg:gap-3 items-center justify-center xl:justify-start">
      <motion.div
        className={classNames(
          styleUtils.appear,
          styleUtils['appear-first'],
          'flex flex-col justify-center gap-3'
        )}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ease: 'circOut', delay: 0.2, duration: 0.8 }}
      >
        <h1 className="flex gap-[24px] justify-center font-normal uppercase text-[28px] md:text-[32px] items-center">
          <span className="tracking-[4px] text-white">Launch week</span>
          <span className="flex justify-center">
            <Image src="/images/launchweek/seven/lw7-seven.svg" width={40} height={40} />
          </span>
        </h1>
        <p className="text-white text-lg text-center">April 3rd - 7th at 7AM PT | 10AM ET</p>
      </motion.div>
    </div>
  )
}
