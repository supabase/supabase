import { useRouter } from 'next/router'

const useDarkLaunchWeeks = () => {
  const { pathname } = useRouter()

  const isLaunchWeek7 = pathname.startsWith('/launch-week/7')
  const isLaunchWeek8 = pathname.startsWith('/launch-week/8')
  const isLaunchWeekX = pathname.startsWith('/launch-week/x')

  return isLaunchWeek7 || isLaunchWeek8 || isLaunchWeekX
}

export default useDarkLaunchWeeks
