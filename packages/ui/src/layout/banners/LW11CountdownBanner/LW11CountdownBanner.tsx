import { useRouter } from 'next/router'
import { Button, cn } from 'ui'
import announcement from '../data/Announcement.json'
import Link from 'next/link'

export function LW11CountdownBanner() {
  const router = useRouter()
  const isHomePage = router.pathname === '/'
  const isLaunchWeekPage = router.pathname === '/ga-week'
  const isLaunchWeekSection =
    router.pathname.includes('/launch-week') || router.pathname.includes('/ga-week')

  if (isLaunchWeekPage || isHomePage) return null

  return (
    <div className="relative w-full p-2 flex items-center group justify-center text-foreground bg-alternative border-b border-muted transition-colors overflow-hidden">
      <div className="relative z-10 flex items-center justify-center">
        <div
          className={cn(
            'w-full flex gap-5 md:gap-10 items-center md:justify-center text-sm',
            isLaunchWeekSection && '!justify-center'
          )}
        >
          <p className="flex gap-1.5 items-center">{announcement.text}</p>
          <Button size="tiny" type="default" className="px-2 !leading-none text-xs" asChild>
            <Link href="https://supabase.com/ga-week#day-5">Learn more</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default LW11CountdownBanner
