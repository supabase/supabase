import React, { PropsWithChildren, useState, useRef, useCallback, useEffect } from 'react'
import { cn } from 'ui'
import SectionContainer from 'components/Layouts/SectionContainer'
import { FifteenSVG, LWSVG } from './lw15.components'
import Image from 'next/image'

const LW15Meetups = ({ className }: PropsWithChildren<{ className?: string }>) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const imageRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback((e: MouseEvent) => {
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

  return (
    <SectionContainer
      className={cn(
        'relative !max-w-none !pb-0 lg:!container flex flex-col overflow-hidden',
        className
      )}
      id="meetups"
    >
      <div className="w-full grid grid-cols-5 gap-4 leading-none">
        <div className="col-span-2 flex flex-col items-start">
          <LWSVG className="h-8 w-auto" />
          <span>Supabase</span>
          <span>Meetups.</span>
        </div>
        <div className="col-span-2 flex flex-col items-start">
          <span>Worldwide</span>
          <span>Meetups</span>
        </div>
        <div className="col-span-1 flex flex-col items-end">
          <FifteenSVG className="h-8 w-auto" />
        </div>
      </div>
      <div className="relative z-10 text-3xl lg:text-4xl xl:text-5xl mt-24">
        Accra / Aix-en-Provence / Amsterdam / Austin / Bangkok / Barranquilla / Bergen / Berlin /
        Berne / Bratislava / Buenos Aires / CDMX / Campeche / Cancun / Chiapas / Chiclayo /
        Cluj-Napoca / Colombo / Constanta / Dar es Salaam / Edinburgh Scotland / Goma / Guayaquil /
        Istambul / Itabira, Minas Gerais / Kampala / Kigali / Lagos / Lima / Limerick / Lisbon /
        Lokoja / Madeira / Madrid / Manta / Merida / Miami / Monterrey / Montreal, Quebec / Nairobi
        / Perth / Piura / Playa del Carmen / Puebla / Richmond, Victoria / San Francisco / San Juan
        / San Luis Potosi / Santiago / Seoul / Sofia / Tanga / Tenerife / Toluca / Toronto Ontario /
        Utah / Victoria, BC
      </div>
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
          className="absolute inset-0 bottom-auto w-full aspect-square hidden dark:block opacity-10"
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
          className="absolute inset-0 bottom-auto w-full aspect-square opacity-10 dark:hidden"
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
  )
}

export default LW15Meetups
