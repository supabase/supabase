import Link from 'next/link'
import { useRouter } from 'next/router'
import Telemetry, { TelemetryEvent } from '~/lib/telemetry'
import { useTelemetryProps } from 'common/hooks/useTelemetryProps'
import gaEvents from '~/lib/gaEvents'
import { Button, cn, IconBookOpen } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'
import AnnouncementBadge from '~/components/Announcement/Badge'
import { useState, useEffect, useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import SwiperCore from 'swiper'
import { Navigation, Pagination, A11y } from 'swiper/modules'

SwiperCore.use([A11y, Navigation, Pagination])

import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

interface Props {
  className?: string
}

const HeroAnnouncement = ({ className }: Props) => {
  const [activeTab, setActiveTab] = useState(0)
  const [apiSwiper, setApiSwiper] = useState(undefined)
  const prevRef = useRef(null)
  const nextRef = useRef(null)

  const router = useRouter()
  const telemetryProps = useTelemetryProps()
  const sendTelemetryEvent = async (event: TelemetryEvent) => {
    await Telemetry.sendEvent(event, telemetryProps, router)
  }

  useEffect(() => {
    if (!apiSwiper) return
    // @ts-ignore
    apiSwiper.slideTo(activeTab)
  }, [activeTab])

  const slides = [
    <AnnouncementBadge
      url="/events/ai-engineer-summit-2024"
      badge="Webinar"
      announcement="Scale to Millions with AI"
    />,
    <AnnouncementBadge
      url="/launch-week"
      badge="Launch Week 12"
      announcement="Claim your ticket"
    />,
  ]

  return (
    <div
      className={cn(
        'z-40 w-full max-w-full flex flex-col gap-4 items-center justify-center -mt-4 md:-mt-12 mb-8 lg:mb-8 mx-auto opacity-0 !animate-[fadeIn_0.5s_cubic-bezier(0.25,0.25,0,1)_0.5s_both]',
        className
      )}
    >
      <Swiper
        modules={[Pagination, Navigation, A11y]}
        // @ts-ignore
        onSwiper={setApiSwiper}
        spaceBetween={10}
        grabCursor
        slidesPerView={'auto'}
        centeredSlides={true}
        watchOverflow
        threshold={1.5}
        pagination={{ clickable: true }}
        navigation={{
          prevEl: prevRef.current,
          nextEl: nextRef.current,
        }}
        onInit={(swiper: any) => {
          swiper.params.navigation.prevEl = prevRef.current
          swiper.params.navigation.nextEl = nextRef.current
          swiper.navigation.update()
        }}
        className="relative h-auto w-full max-w-md"
      >
        <div
          className={cn(
            'not-sr-only absolute inset-0 left-auto bg-gradient-to-r from-transparent to-background w-16 z-20 pointer-events-none'
          )}
        />
        <div
          className={cn(
            'not-sr-only absolute inset-0 right-auto bg-gradient-to-l from-transparent to-background w-16 z-20 pointer-events-none'
          )}
        />
        {slides.map((slide, i) => (
          <SwiperSlide
            key={`hp-hero-announcement-${i + 1}`}
            className="!w-fit !shrink-0 flex justify-center !transition-opacity opacity-40 [&.swiper-slide-active]:opacity-100"
          >
            {slide}
          </SwiperSlide>
        ))}
        <div className="not-sr-only h-10" aria-hidden />
      </Swiper>
    </div>
  )
}

export default HeroAnnouncement
