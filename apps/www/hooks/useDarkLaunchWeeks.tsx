'use client'

import { usePathname } from 'next/navigation'

const useDarkLaunchWeeks = () => {
  const pathname = usePathname()

  const isLaunchWeek7 = pathname?.startsWith('/launch-week/7')
  const isLaunchWeek8 = pathname?.startsWith('/launch-week/8')

  return isLaunchWeek7 || isLaunchWeek8
}

export default useDarkLaunchWeeks
