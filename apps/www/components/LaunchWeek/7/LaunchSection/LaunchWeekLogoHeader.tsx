import classNames from 'classnames'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useBreakpoint } from 'common/hooks/useBreakpoint'

export function LaunchWeekLogoHeader() {
  const isMobile = useBreakpoint(640)

  return (
    <div className="flex flex-col gap-1 md:gap-2 items-center my-4 lg:pt-8 justify-start">
      <motion.div
        className={classNames('flex flex-col justify-center gap-3')}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.24, 0.25, 0.05, 1], delay: 0.2 }}
      >
        <h1 className="flex gap-4 justify-center font-normal uppercase text-[28px] sm:text-[32px] items-center">
          <span className="tracking-[4px] text-white">Launch week</span>
          <span className="flex justify-center">
            <Image
              src="/images/launchweek/seven/lw7-seven.svg"
              width={isMobile ? 36 : 40}
              height={isMobile ? 36 : 40}
              alt="Launch Week 7"
            />
          </span>
        </h1>
        <p className="text-white radial-gradient-text-600 text-md sm:text-lg text-center">
          April 10th – 14th at 7AM PT | 10AM ET
        </p>
      </motion.div>
    </div>
  )
}
