import { useRouter } from 'next/router'
import Lw8BannerBg from './Lw8BannerBg'
// import VideoPreview from './VideoPreview'

export function LW8CountdownBanner() {
  const { pathname } = useRouter()
  const isHomePage = pathname === '/'
  const isLaunchWeekPage = pathname === '/launch-week'
  const isLaunchWeekSection = pathname.includes('launch-week')

  if (isLaunchWeekPage || isHomePage) return null

  return (
    <div
      className="relative w-full h-14 p-2 flex items-center group justify-center text-white !bg-cover !bg-center overflow-hidden"
      style={{
        background:
          'linear-gradient(to right, #020405 10%, #1D0B31 40%, #1B113B 50%, #122029 70%, #020405 90%)',
      }}
    >
      <div className="relative z-10 flex items-center justify-center">
        <div
          className={[
            'w-full flex gap-3 md:gap-6 items-center md:justify-center text-sm md:text-base',
            isLaunchWeekSection && '!justify-center',
          ].join(' ')}
        >
          <p>
            <span className="hidden md:inline">Supabase</span> Launch Week 8
          </p>
          {/* <VideoPreview /> */}
        </div>
      </div>
      <Lw8BannerBg className="absolute z-0 inset-0 w-full flex items-center justify-center h-auto min-h-full [&>svg]:w-auto [&>svg]:h-[40%] md:[&>svg]:h-[64%]" />
    </div>
  )
}

export default LW8CountdownBanner
