import React, { useEffect, useRef } from 'react'
import { createTimeline } from 'animejs'

import SectionContainer from 'components/Layouts/SectionContainer'
import { FifteenSVG, LW15ThemeSwitcher, LWSVG } from './lw15.components'

const LW15Heading = () => {
  const videoRef = useRef<HTMLVideoElement>(null)

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
    <header className="border-b">
      <SectionContainer className="flex flex-col justify-between gap-12 !py-8 lg:!py-10 h-full !max-w-none lg:!container">
        <div className="grid md:grid-cols-5 gap-4 delay-100">
          <div
            data-animate
            data-animate-delay={300}
            className="opacity-0 col-span-3 lg:col-span-2 text-xs overflow-hidden h-fit max-w-[400px]"
          >
            Five days of launches to supercharge your development.
          </div>
          <div className="flex flex-col justify-start lg:col-start-4 md:col-span-2 lg:col-span-1 gap-4"></div>
          <div className="col-span-1 text-right text-xs hidden lg:flex justify-end items-start h-fit overflow-hidden">
            <LW15ThemeSwitcher className="opacity-0 anim-last" />
          </div>
        </div>
        <div className="flex flex-col gap-4 xl:mt-24">
          <div className="w-full flex items-center justify-center h-[42px] md:h-[60px] lg:h-[92px] gap-4">
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
        </div>
      </SectionContainer>
    </header>
  )
}

export default LW15Heading
