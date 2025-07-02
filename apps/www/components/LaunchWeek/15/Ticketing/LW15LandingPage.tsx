import React from 'react'
import SectionContainer from 'components/Layouts/SectionContainer'
import { Button, cn } from 'ui'
import { useTheme } from 'next-themes'
import Link from 'next/link'

const LW15LandingPage = () => {
  const { resolvedTheme, setTheme } = useTheme()
  const isDarkMode = resolvedTheme?.includes('dark')

  const ticketId = ''
  const detectedTimezone = 'GMT+1'
  const currentTime = '17:03:45'
  const year = '2025'

  const centerColClassNames = cn(
    'md:col-start-6 md:col-span-6',
    'xl:col-start-7 xl:col-span-5',
    '2xl:col-start-8 2xl:col-span-4'
  )

  return (
    <SectionContainer className="flex flex-col justify-between gap-12 !py-10 h-full">
      <div className="flex justify-between items-start text-xs">
        <div className="flex flex-col">
          <div>Detected timezone: {detectedTimezone}</div>
          <div>Time: {currentTime}</div>
        </div>
        <div className="flex items-center justify-start gap-2">
          <button
            onClick={() => setTheme('dark')}
            className={cn(isDarkMode ? 'text-foreground' : 'text-foreground-lighter')}
          >
            dark mode
          </button>{' '}
          /
          <button
            onClick={() => setTheme('light')}
            className={cn(!isDarkMode ? 'text-foreground' : 'text-foreground-lighter')}
          >
            light mode
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className="w-full flex items-center justify-center h-[60px] md:h-[100px] lg:h-[145px] gap-4">
          <h1 className="sr-only">Supabase Launch Week 15</h1>
          <svg
            width="270"
            height="146"
            viewBox="0 0 270 146"
            className="h-full w-auto"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M21.2516 0.5V127.9H97.8516V145.5H0.851562V0.5H21.2516Z" fill="currentColor" />
            <path
              d="M192.348 0.5L220.948 122.3L247.748 0.5H269.148L232.948 145.5H208.148L180.148 26.3L152.748 145.5H127.948L91.1484 0.5H113.548L141.548 122.3L168.348 0.5H192.348Z"
              fill="currentColor"
            />
          </svg>
          <div className="relative h-full flex-1 dark:mix-blend-screen dark:invert-0 invert">
            <video
              src="/images/launchweek/15/galazy-horizontal-dark.mp4"
              autoPlay
              muted
              loop
              className="h-full w-full object-cover "
            />
          </div>
          <svg
            width="185"
            height="148"
            viewBox="0 0 185 148"
            className="h-full w-auto"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M52.1653 145.393H33.8891V31.6856H0.148438V19.252C20.8347 18.6504 31.8807 15.6423 39.7134 0H52.1653V145.393Z"
              fill="currentColor"
            />
            <path
              d="M132.332 132.759C149.805 132.759 164.868 120.125 164.868 97.664C164.868 73.5989 147.998 63.1707 132.132 63.1707C117.069 63.1707 107.228 71.9946 104.014 79.2141L85.7381 78.2114L95.1775 0H178.726V17.0461H110.039L105.019 58.3577C112.851 50.9377 124.299 47.3279 136.349 47.3279C161.855 47.3279 184.148 65.3767 184.148 97.4634C184.148 130.753 159.445 148 132.332 148C98.7925 148 83.1272 126.743 80.5163 103.279H99.3951C102.408 121.729 112.048 132.759 132.332 132.759Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <div className="grid md:grid-cols-12 gap-4">
          <div className="hidden md:block md:col-span-4 text-sm">
            Celebrate our launch week with exciting new features designed to take your development
            skills to the next level.
          </div>
          <div className={cn('flex flex-col items-start gap-4', centerColClassNames)}>
            <h2 className="text-3xl lg:text-4xl">
              Discover fresh tools, <br />
              unlock new possibilities.
            </h2>
            <Button className="h-auto py-1 px-2" type="secondary" size="medium" asChild>
              <Link href="/launch-week/ticket">Claim your ticket</Link>
            </Button>
          </div>
          <div className="md:col-start-12 text-right hidden md:block">{year}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-12 gap-4 text-xs items-end">
        <div className="md:col-span-4 hidden md:block">
          <div className="w-full h-px bg-foreground" />
        </div>
        <div className={cn(centerColClassNames)}>
          <p>Claim your ticket to enter LW15</p>
        </div>
        <div className="md:col-start-12 text-right text-nowrap">Online users: 9</div>
      </div>
    </SectionContainer>
  )
}

export default LW15LandingPage
