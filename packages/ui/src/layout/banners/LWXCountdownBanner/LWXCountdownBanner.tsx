import { useRouter } from 'next/router'
import announcement from '../data/Announcement.json'
import Countdown from './Countdown'
import Image from 'next/image'
import { Button } from 'ui'

// import VideoPreview from './VideoPreview'

export function LWXCountdownBanner() {
  const { pathname } = useRouter()
  const isHomePage = pathname === '/'
  const isLaunchWeekPage = pathname === '/launch-week'
  const isLaunchWeekSection = pathname.includes('launch-week')
  const LWXLogo =
    'https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/lwx/assets/lwx_logo.svg?t=2023-11-22T17%3A45%3A52.077Z'

  if (isLaunchWeekPage || isHomePage) return null

  return (
    <div className="relative w-full h-14 p-2 flex items-center group justify-center text-foreground bg-alternative hover:bg-surface-200 dark:bg-[#020405] hover:dark:bg-[#05080a] transition-colors overflow-hidden">
      <div className="relative z-10 flex items-center justify-center">
        <div
          className={[
            'w-full flex gap-5 md:gap-10 items-center md:justify-center text-sm',
            isLaunchWeekSection && '!justify-center',
          ].join(' ')}
        >
          <div className="flex gap-1.5 items-center">
            <p>Launch Week</p>
            <Image
              src={LWXLogo}
              alt="Supabase Launch Week X Logo"
              width={14}
              height={14}
              className="filter contrast-0 dark:contrast-100"
            />
          </div>
          <div className="hidden sm:block">Day 4: Supabase Auth Day</div>
          <Button
            onClick={() => null}
            size="tiny"
            type="secondary"
            className="px-2 py-1 !leading-none text-xs"
          >
            Go to Launch Week
          </Button>
        </div>
      </div>
    </div>
  )
}

export default LWXCountdownBanner
