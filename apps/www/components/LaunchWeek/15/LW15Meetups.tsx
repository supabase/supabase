import React, { PropsWithChildren, useState, useRef, useCallback, useEffect } from 'react'
import { cn } from 'ui'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { FifteenSVG, LWSVG } from './lw15.components'
import SectionContainer from 'components/Layouts/SectionContainer'
import { DEFAULT_EASE } from 'lib/animations'
import { LumaEvent } from 'app/api-v2/luma-events/route'

interface Props {
  className?: string
  meetups?: LumaEvent[]
}

interface MeetupOverlayCardProps {
  meetup: LumaEvent | null
  mousePosition: { x: number; y: number }
  visible: boolean
}

const MotionLink = motion(Link)

const LW15Meetups = ({ className, meetups = [] }: PropsWithChildren<Props>) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [globalMousePosition, setGlobalMousePosition] = useState({ x: 0, y: 0 })
  const imageRef = useRef<HTMLDivElement>(null)
  const now = new Date(Date.now())
  const [activeMeetup, setActiveMeetup] = useState<LumaEvent | null>(null)
  const [showOverlay, setShowOverlay] = useState(false)
  const ref = React.useRef(null)
  const isInView = useInView(ref, { margin: '-25%', once: true })

  const variants = {
    reveal: {
      transition: {
        type: 'spring',
        damping: 10,
        mass: 0.75,
        stiffness: 100,
        staggerChildren: 0.018,
      },
    },
  }

  const meetupVariants = {
    initial: {
      y: '100%',
      opacity: 0,
    },
    reveal: {
      y: 0,
      opacity: 1,
      transition: {
        ease: DEFAULT_EASE,
        duration: 0.5,
      },
    },
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    // Global mouse position for overlay
    setGlobalMousePosition({
      x: e.clientX,
      y: e.clientY,
    })

    // Relative mouse position for image effects
    if (!imageRef.current) return
    const rect = imageRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setMousePosition({ x, y })
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [handleMouseMove])

  function handleSelectMeetup(meetup: LumaEvent) {
    setActiveMeetup(meetup)
    setShowOverlay(true)
  }

  function handleMouseLeave() {
    setActiveMeetup(null)
    setShowOverlay(false)
  }

  const meetupsSortedByCity = meetups.sort((a, b) =>
    getMeetupCity(a).localeCompare(getMeetupCity(b))
  )

  return (
    <>
      <MeetupOverlayCard
        meetup={activeMeetup}
        mousePosition={globalMousePosition}
        visible={showOverlay}
      />

      <SectionContainer
        className={cn(
          'relative !max-w-none !pb-0 lg:!container flex flex-col overflow-hidden',
          className
        )}
        id="meetups"
      >
        <div className="w-full leading-none">
          <h3 className="text-2xl lg:text-3xl">LW15 Worldwide Meetups</h3>
          <p className="text-left text-sm text-foreground-light mt-2">
            Join us for community-driven meetups around the world to celebrate Launch Week 15.
          </p>
        </div>
        <motion.div
          ref={ref}
          variants={variants}
          animate={isInView ? 'reveal' : 'initial'}
          onMouseLeave={handleMouseLeave}
          className={cn(
            'relative w-full z-10 text-3xl lg:text-4xl xl:text-5xl mt-24 flex flex-wrap gap-x-2 md:gap-x-3 gap-y-1',
            activeMeetup && 'text-foreground-muted'
          )}
        >
          {meetupsSortedByCity &&
            meetupsSortedByCity?.map((meetup: LumaEvent, i: number) => {
              const startAt = new Date(meetup.start_at)
              const endAt = addHours(new Date(meetup.start_at), 3)
              const after = now > startAt
              const before3H = now < endAt
              const liveNow = after && before3H

              return (
                <>
                  <MotionLink
                    variants={meetupVariants}
                    key={`meetup-link-${meetup.id}`}
                    href={meetup.url ?? ''}
                    target="_blank"
                    onClick={() => handleSelectMeetup(meetup)}
                    onMouseEnter={() => handleSelectMeetup(meetup)}
                    title={liveNow ? 'Live now' : undefined}
                    className={cn(
                      'h-10 group inline-flex items-center flex-wrap',
                      '!leading-none transition-colors',
                      meetup.id === activeMeetup?.id && 'text-foreground'
                      // liveNow && 'text-foreground-light'
                    )}
                  >
                    {liveNow && (
                      <div className="w-2 h-2 rounded-full bg-brand mr-2 mb-4 animate-pulse" />
                    )}
                    <span>{getMeetupCity(meetup)}</span>
                  </MotionLink>
                  {i !== meetups.length - 1 && (
                    <motion.span
                      variants={meetupVariants}
                      className="ml-0 mb-0 my-auto flex transition-colors"
                    >
                      /
                    </motion.span>
                  )}
                </>
              )
            })}
        </motion.div>
        <div
          ref={imageRef}
          className="mx-auto h-[400px] -mt-32 -mb-20 lg:mt-0 lg:mb-0 aspect-square lg:aspect-[2/1] overflow-hidden relative"
        >
          <Image
            src="/images/launchweek/15/lw15-globe-dark.png"
            alt="Meetups Globe"
            width={1000}
            height={1000}
            quality={100}
            className="absolute inset-0 bottom-auto w-full aspect-square hidden dark:block opacity-30"
          />
          <Image
            src="/images/launchweek/15/lw15-globe-dark.png"
            alt="Meetups Globe"
            width={1000}
            height={1000}
            quality={100}
            className="absolute inset-0 bottom-auto w-full aspect-square hidden dark:block opacity-60"
            style={{
              maskImage: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, white 0%, transparent 100%)`,
              WebkitMaskImage: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, white 0%, transparent 100%)`,
            }}
          />
          <Image
            src="/images/launchweek/15/lw15-globe-light.png"
            alt="Meetups Globe"
            width={1000}
            height={1000}
            quality={100}
            className="absolute inset-0 bottom-auto w-full aspect-square opacity-30 dark:hidden"
          />
          <Image
            src="/images/launchweek/15/lw15-globe-light.png"
            alt="Meetups Globe"
            width={1000}
            height={1000}
            quality={100}
            className="absolute inset-0 bottom-auto w-full aspect-square dark:hidden opacity-60"
            style={{
              maskImage: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, white 0%, transparent 100%)`,
              WebkitMaskImage: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, white 0%, transparent 100%)`,
            }}
          />
        </div>
      </SectionContainer>
    </>
  )
}

const handleCountry = (country: string) => {
  if (country === 'United States') return 'USA'
  if (country === 'United Kingdom') return 'UK'
  if (country === 'United Arab Emirates') return 'UAE'
  if (country === 'Democratic Republic of the Congo') return 'Congo'
  return country
}

const MeetupOverlayCard = ({ meetup, mousePosition, visible }: MeetupOverlayCardProps) => {
  const show = !(!meetup || !visible)

  // Calculate if overlay should appear to the left of cursor
  const overlayWidth = 320
  const distanceToRightEdge =
    typeof window !== 'undefined' ? window.innerWidth - mousePosition.x : 1000
  const shouldPositionLeft = distanceToRightEdge < overlayWidth

  return (
    <div
      className={cn(
        'fixed z-50 pointer-events-none opacity-0 transition-opacity',
        show && 'opacity-100'
      )}
      style={{
        left: shouldPositionLeft ? mousePosition.x - overlayWidth - 15 : mousePosition.x + 15,
        top: mousePosition.y + 15,
      }}
    >
      <div className="bg-black dark:bg-foreground text-white dark:text-background p-2 rounded-sm shadow-lg border w-screen max-w-xs flex flex-col gap-2">
        <div className="w-full flex justify-between items-start gap-1 h-8">
          <LWSVG className="h-full w-auto" />
          <div className="relative h-full flex-1 overflow-hidden">
            <Image
              src="/images/launchweek/15/lw15-galaxy.png"
              alt="Meetups Galaxy"
              width={1000}
              height={1000}
              className="h-full w-full object-cover object-[0%_30%]"
            />
          </div>
          <FifteenSVG className="h-full w-auto mr-0.5" />
        </div>
        <div className="w-full flex justify-between gap-1 text-lg !leading-none">
          <div className="">Meetup</div>
          <div className="text-right">
            {getMeetupCity(meetup!)}, {getMeetupCountry(meetup!)}
          </div>
        </div>
      </div>
    </div>
  )
}

function addHours(start_at: Date, hours: number) {
  const dateCopy = new Date(start_at)
  dateCopy.setHours(dateCopy.getHours() + hours)

  return dateCopy
}

const getMeetupCity = (meetup: LumaEvent) => {
  if (!meetup) return ''
  return (
    meetup.city ??
    meetup.name.split(',')[0].split('-')[1].trim() ??
    meetup.name.split(',')[0].split(' ')[1].trim() ??
    meetup.name
  )
}
const getMeetupCountry = (meetup: LumaEvent) => handleCountry(meetup?.country ?? '')

export default LW15Meetups
