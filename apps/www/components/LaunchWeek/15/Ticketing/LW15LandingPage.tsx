import React from 'react'
import Link from 'next/link'
import { Button, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import SectionContainer from 'components/Layouts/SectionContainer'
import useLw15ConfData from 'components/LaunchWeek/15/hooks/use-conf-data'
import { useRegistration } from '../hooks/use-registration'
import { FifteenSVG, LW15ThemeSwitcher, LWSVG } from '../lw15.components'
import { LoaderCircle } from 'lucide-react'

const LW15LandingPage = () => {
  const register = useRegistration()
  const [state] = useLw15ConfData()
  const user = state.userTicketData
  const isLoading = !state.sessionLoaded

  const detectedTimezone = 'GMT+1'
  const currentTime = '17:03:45'
  const year = '2025'

  const centerColClassNames = cn(
    'md:col-start-6 md:col-span-6',
    'xl:col-start-7 xl:col-span-5',
    '2xl:col-start-8 2xl:col-span-4'
  )

  const handleClaimTicket = () => register.signIn()

  return (
    <SectionContainer className="flex flex-col justify-between gap-12 !py-10 h-full">
      <div className="flex justify-between items-start text-xs">
        <div className="flex flex-col">
          <div>Detected timezone: {detectedTimezone}</div>
          <div>Time: {currentTime}</div>
        </div>
        <LW15ThemeSwitcher />
      </div>
      <div className="flex flex-col gap-4">
        <div className="w-full flex items-center justify-center h-[60px] md:h-[100px] lg:h-[145px] gap-4">
          <h1 className="sr-only">Supabase Launch Week 15</h1>
          <LWSVG className="h-full w-auto" />
          <div className="relative h-full flex-1 dark:mix-blend-screen">
            <video
              src="/images/launchweek/15/lw15-galaxy.mp4"
              autoPlay
              muted
              loop
              className="h-full w-full object-cover"
            />
          </div>
          <FifteenSVG className="h-full w-auto" />
        </div>
        <div className="grid md:grid-cols-12 gap-4 delay-100">
          <div className="hidden md:block md:col-span-4 text-sm">
            Celebrate our launch week with exciting new features designed to take your development
            skills to the next level.
          </div>
          <div className={cn('flex flex-col items-start gap-4', centerColClassNames)}>
            <h2 className="text-3xl lg:text-4xl">
              Discover fresh tools, <br />
              unlock new possibilities.
            </h2>
            <div>
              {user.id ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button className="h-auto py-1 px-2" type="secondary" size="medium" asChild>
                      <Link href="/launch-week/ticket">
                        {isLoading ? (
                          <LoaderCircle className="w-4 h-4 animate-spinner" />
                        ) : (
                          'View your ticket'
                        )}
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    You claimed a ticket as @{user.username}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Button
                  className="h-auto py-1 px-2 min-w-[125px] min-h-[28px]"
                  type="secondary"
                  size="medium"
                  onClick={handleClaimTicket}
                >
                  {isLoading ? (
                    <LoaderCircle className="w-4 h-4 animate-spinner" />
                  ) : (
                    'Claim your ticket'
                  )}
                </Button>
              )}
            </div>
          </div>
          <div className="md:col-start-12 text-right hidden md:block">{year}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-12 gap-4 text-xs items-end">
        <div className="md:col-span-4 hidden md:block">
          <div className="w-full h-px bg-foreground" />
        </div>
        <div className={cn(centerColClassNames)}>
          <p>
            {user.id
              ? `Nice to see you back, ${user.name?.split(' ')[0]}`
              : 'Claim your ticket to enter LW15'}
          </p>
        </div>
        <div className="md:col-start-12 text-right text-nowrap">Online users: 9</div>
      </div>
    </SectionContainer>
  )
}

export default LW15LandingPage
