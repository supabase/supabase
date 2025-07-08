import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { LoaderCircle } from 'lucide-react'
import { Button, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { useRegistration } from '../hooks/use-registration'
import useUserPresence from '../hooks/useUserPresence'
import { createTimeline } from 'animejs'

import SectionContainer from 'components/Layouts/SectionContainer'
import useLw15ConfData from 'components/LaunchWeek/15/hooks/use-conf-data'
import { FifteenSVG, LW15ThemeSwitcher, LWSVG } from '../lw15.components'

const LW15LandingPage = () => {
  const onlineUsers = useUserPresence()
  const videoRef = useRef<HTMLVideoElement>(null)
  const register = useRegistration()
  const [state] = useLw15ConfData()
  const user = state.userTicketData
  const isLoading = !state.sessionLoaded

  const [detectedTimezone, setDetectedTimezone] = useState('')
  const [currentTime, setCurrentTime] = useState('')
  const year = '2025'

  const centerColClassNames = cn(
    'md:col-start-6 md:col-span-6',
    'xl:col-start-7 xl:col-span-5',
    '2xl:col-start-8 2xl:col-span-4'
  )

  const handleClaimTicket = () => register.signIn()

  // Detect user's timezone
  useEffect(() => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const now = new Date()

      const offsetString = now
        .toLocaleString('en', {
          timeZoneName: 'short',
        })
        .split(' ')
        .pop()

      setDetectedTimezone(`${offsetString}`)
    } catch (error) {
      setDetectedTimezone('Unknown')
    }
  }, [])

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const hours = now.getHours().toString().padStart(2, '0')
      const minutes = now.getMinutes().toString().padStart(2, '0')
      const seconds = now.getSeconds().toString().padStart(2, '0')
      setCurrentTime(`${hours}:${minutes}:${seconds}`)
    }

    updateTime()

    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [])

  // Force play video
  useEffect(() => {
    if (!videoRef || !videoRef.current) return

    //open bug since 2017 that you cannot set muted in video element https://github.com/facebook/react/issues/10389
    videoRef.current.defaultMuted = true
    videoRef.current.muted = true

    if (!!videoRef && !!videoRef.current) {
      const promise = videoRef.current.play()
      videoRef.current.play()
      if (promise !== undefined) {
        promise.then(() => {
          // Auto-play started
          videoRef.current?.play()
        })
      }
    }
  }, [videoRef])

  useEffect(() => {
    const tl = createTimeline({ defaults: { duration: 750 } })

    tl.add('.lw15-logo', {
      opacity: [0, 1],
      scale: [0.9, 1],
      translateY: [20, 0],
      easing: 'outQuad',
      duration: 1500,
    })
      .add('.lw15-galaxy', {
        width: ['0%', '100%'],
        flex: [0, 1],
        scale: [0.9, 1],
        opacity: [0, 1],
        easing: 'cubicBezier(0.25, 0.1, 0.25, 1)',
        duration: 500,
      })
      .add(
        '.anim-last',
        {
          opacity: [0, 1],
          translateY: ['100%', 0],
          easing: 'cubicBezier(0.25, 0.1, 0.25, 1)',
          duration: 600,
        },
        '+=300'
      )
      .add(
        '.animate-line',
        {
          width: [0, '100%'],
          easing: 'inOutCubic',
          duration: 400,
        },
        '-=600'
      )
      .add(
        '.animate-cta',
        {
          opacity: [0, 1],
          translateY: [10, 0],
          easing: 'cubicBezier(.1,0,1,1)',
          duration: 1000,
        },
        '-=100'
      )

    const elements = document.querySelectorAll('[data-animate]')
    elements.forEach((element) => {
      if (element.getAttribute('data-animate-processed')) return
      element.setAttribute('data-animate-processed', 'true')

      const originalContent = element.innerHTML || ''
      element.classList.add('overflow-hidden')

      const span = document.createElement('span')
      span.innerHTML = originalContent
      span.style.display = 'inline-block'
      span.style.transform = 'translateY(100%)'
      span.style.transition = 'transform ease-[.25,.25,0,1]'

      element.innerHTML = ''
      element.appendChild(span)

      const delay = parseInt(element.getAttribute('data-animate-delay') || '100')
      const duration = parseInt(element.getAttribute('data-animate-duration') || '900')

      setTimeout(() => {
        setTimeout(() => {
          element.classList.add('opacity-100')
          span.style.transitionDuration = `${duration}ms`
          span.style.transform = 'translateY(0)'
        }, delay)
        // Delay after initial animejs animation
      }, 1500)
    })
  }, [])

  return (
    <SectionContainer className="flex flex-col justify-between gap-12 !py-10 h-full">
      <div className="flex justify-between items-start text-xs">
        <div className="flex flex-col">
          <div className="overflow-hidden">
            <span className="opacity-0 anim-last inline-block">
              Detected timezone: {detectedTimezone}
            </span>
          </div>
          <div className="overflow-hidden">
            <span className="opacity-0 anim-last inline-block">Time: {currentTime}</span>
          </div>
        </div>
        <div className="overflow-hidden">
          <LW15ThemeSwitcher className="opacity-0 anim-last" />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className="w-full flex items-center justify-center h-[60px] md:h-[100px] lg:h-[120px] xl:h-[145px] gap-4">
          <h1 className="sr-only">Supabase Launch Week 15</h1>
          <LWSVG className="opacity-0 lw15-logo lw15-logo-left h-full w-auto" />
          <div className="lw15-galaxy opacity-0 relative h-full w-0 flex-0 dark:mix-blend-screen overflow-hidden">
            <video
              ref={videoRef}
              src="/images/launchweek/15/lw15-galaxy.mp4"
              poster="/images/launchweek/15/lw15-galaxy.png"
              autoPlay
              muted
              loop
              playsInline
              controls={false}
              className="h-full w-full object-cover"
            />
          </div>
          <FifteenSVG className="opacity-0 lw15-logo lw15-logo-right h-full w-auto mr-0.5" />
        </div>
        <div className="grid md:grid-cols-12 gap-4 delay-100">
          <div
            data-animate
            data-animate-delay={300}
            className="hidden md:inline-block opacity-0 md:col-span-4 text-xs overflow-hidden h-fit"
          >
            Celebrate our launch week with exciting new features designed to take your development
            skills to the next level.
          </div>
          <div className={cn('flex flex-col items-start gap-4', centerColClassNames)}>
            <h2
              data-animate
              data-animate-delay={400}
              data-animate-duration={800}
              className="text-3xl lg:text-4xl opacity-0 tracking-[-0.25px]"
            >
              Five days of launches
              <br /> to supercharge
              <br /> your development.
            </h2>
            <div className="opacity-0 animate-cta">
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
          <div
            data-animate
            data-animate-delay={300}
            className="md:col-start-12 text-right hidden md:block h-fit opacity-0"
          >
            {year}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-12 gap-4 text-xs items-end">
        <div className="md:col-span-4 hidden md:block">
          <div className="w-0 h-px bg-foreground animate-line" />
        </div>
        <div className={cn(centerColClassNames)}>
          <p data-animate data-animate-delay={1200} className="opacity-0">
            {user.id
              ? `Nice to see you back, ${user.name?.split(' ')[0]}`
              : 'Claim your ticket to enter LW15'}
          </p>
        </div>
        <div className="md:col-start-12 text-right text-nowrap items-end overflow-hidden">
          <span className="opacity-0 anim-last inline-block">Online: {onlineUsers}</span>
        </div>
      </div>
    </SectionContainer>
  )
}

export default LW15LandingPage
