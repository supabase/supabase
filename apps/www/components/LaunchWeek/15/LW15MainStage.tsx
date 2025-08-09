import 'swiper/css'
import 'swiper/css/a11y'
import 'swiper/css/navigation'
import 'swiper/css/controller'
import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button, cn } from 'ui'
import { useTheme } from 'next-themes'
import { Swiper, SwiperClass, SwiperRef, SwiperSlide } from 'swiper/react'
import { Controller, Navigation, A11y } from 'swiper/modules'

import SectionContainer from 'components/Layouts/SectionContainer'
import { mainDays, WeekDayProps } from './data'
import { useWindowSize } from 'react-use'
import { useBreakpoint } from 'common'
import { DayLink } from './lw15.components'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const LW15MainStage = ({ className }: { className?: string }) => {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme?.includes('dark')
  const swiperRef = useRef<SwiperRef>(null)
  const [controlledSwiper, setControlledSwiper] = useState<SwiperClass | null>(null)
  const days = mainDays(isDark!)

  return (
    <div className="relative pb-8 lg:pb-24 overflow-hidden">
      <SectionContainer
        className={cn(
          'relative !max-w-none !pb-4 md:pb-4 !pt-8 xl:!pt-10 lg:!container flex flex-col gap-4',
          className
        )}
        id="main-stage"
      >
        <div className="flex justify-between items-center">
          <h3 className="text-2xl lg:text-3xl">Main Stage</h3>
          <div className="flex xl:hidden items-center gap-2 text-foreground-muted">
            <button
              onClick={() => controlledSwiper?.slidePrev()}
              className="p-2 rounded-full hover:text-foreground border hover:border-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4 -translate-x-px text-current" />
            </button>
            <button
              onClick={() => controlledSwiper?.slideNext()}
              className="p-2 rounded-full hover:text-foreground border hover:border-foreground transition-colors"
            >
              <ChevronRight className="w-4 h-4 translate-x-px text-current" />
            </button>
          </div>
        </div>
        <div className="hidden xl:flex flex-nowrap justify-between gap-2">
          {days.map((day) => (
            <DayCard day={day} key={day.dd} />
          ))}
        </div>
      </SectionContainer>
      <CardsSlider
        slides={days}
        className="xl:hidden"
        swiperRef={swiperRef}
        setControlledSwiper={setControlledSwiper}
        controlledSwiper={controlledSwiper}
      />
    </div>
  )
}

const DayCard = ({ day }: { day: WeekDayProps }) =>
  day.shipped ? (
    <DayCardShipped day={day} />
  ) : (
    <div
      className={cn(
        'group/main block w-full bg-surface-200 dark:bg-transparent h-full xl:flex-1 xl:h-auto xl:aspect-[217/275] relative overflow-hidden rounded border dark:border-muted'
      )}
    >
      <div className="w-full h-full relative z-10 flex flex-col justify-between gap-4">
        <div></div>
        <div className="flex flex-col gap-2 p-4 pt-0">
          <span className="text-xl text-foreground-lighter">{day.date}</span>
          <span className="text-base leading-snug text-foreground-muted">
            &#91; Access locked &#93;
          </span>
        </div>
      </div>
    </div>
  )

const DayCardShipped = ({ day }: { day: WeekDayProps }) => {
  const hiddenRef = useRef<HTMLDivElement>(null)
  const isTablet = useBreakpoint(1024)
  const [hiddenHeight, setHiddenHeight] = useState(0)
  const { width } = useWindowSize()
  const padding = 8

  useEffect(() => {
    if (hiddenRef?.current) {
      const { height } = hiddenRef.current.getBoundingClientRect()
      setHiddenHeight(height + padding)
    }
  }, [hiddenRef, width])

  return (
    <div
      className={cn(
        'group/main block w-full h-full xl:flex-1 xl:h-auto xl:aspect-[217/275] relative overflow-hidden rounded border border-strong text-white',
        day.isToday && 'ring-1 ring-foreground-lighter ring-offset-2 ring-offset-background'
      )}
    >
      <CardBG day={day} />
      <div className="w-full h-full relative z-10 flex flex-col justify-between gap-4 overflow-hidden">
        <ul className="flex flex-col gap-1 p-4 pb-0 lg:opacity-0 lg:blur-lg duration-300 group-hover/main:lg:blur-none transition-all group-hover/main:lg:opacity-100">
          {day.links?.map((link) => (
            <li key={link.href}>
              <DayLink
                {...link}
                className="transition-all duration-300 !ease-[.25,.25,0,1] lg:-translate-y-full lg:opacity-0 group-hover/main:translate-y-0 group-hover/main:opacity-100"
              />
            </li>
          ))}
        </ul>
        <div
          className="flex flex-col p-4 pt-0 gap-2 relative group-hover/main:!bottom-0 !ease-[.25,.25,0,1] duration-300"
          style={{
            bottom: isTablet ? 0 : -hiddenHeight + 'px',
          }}
        >
          <span className="text-lg opacity-60">{day.date}</span>
          <h4 className="text-xl leading-snug">{day.title}</h4>
          <div
            className="block lg:opacity-0 lg:blur-lg duration-300 group-hover/main:lg:blur-none transition-all group-hover/main:lg:opacity-100"
            ref={hiddenRef}
          >
            <Button type="outline" size="small" className="text-current rounded-sm border-dashed">
              <Link href={day.blog!}>Read more</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

const CardBG = ({ day }: { day: WeekDayProps }) => (
  <div className="absolute inset-0 z-0 w-full h-full">
    {day.steps[0]?.bg_layers &&
      day.steps[0]?.bg_layers?.map((layer, i) => (
        <>
          {!!layer.img && (
            <div
              key={`${day.title}-image-${i}?v=3`}
              className={cn(
                'absolute inset-0 w-full h-full -z-10',
                'transition-all duration-300 !ease-[.24,0,.22,.99]',
                'dark:opacity-50 scale-100',
                'group-hover/main:dark:opacity-100'
              )}
            >
              <Image
                src={layer.img}
                className={`
                            absolute object-cover
                            w-full h-full z-0 transition-all duration-300
                            object-center sm:object-right
                          `}
                fill
                sizes="100%"
                quality={100}
                alt={day.title}
              />
            </div>
          )}
        </>
      ))}
    <div className="absolute inset-0 z-0 w-full h-full bg-gradient-to-b from-black/80 via-black/30 to-black/90" />
  </div>
)

interface Props {
  className?: string
  slides: WeekDayProps[]
  swiperRef: React.RefObject<SwiperRef>
  setControlledSwiper: (swiper: SwiperClass) => void
  controlledSwiper: SwiperClass | null
}

const CardsSlider: React.FC<Props> = ({
  slides,
  className,
  swiperRef,
  setControlledSwiper,
  controlledSwiper,
}) => (
  <div className={cn('relative lg:container mx-auto px-6 lg:px-16', className)}>
    <Swiper
      ref={swiperRef}
      onSwiper={setControlledSwiper}
      modules={[Controller, Navigation, A11y]}
      initialSlide={0}
      spaceBetween={8}
      slidesPerView={1.5}
      breakpoints={{
        520: {
          slidesPerView: 1.9,
        },
        640: {
          slidesPerView: 2.5,
        },
        720: {
          slidesPerView: 2.8,
        },
        960: {
          slidesPerView: 3.2,
        },
      }}
      speed={400}
      watchOverflow
      threshold={2}
      controller={{ control: controlledSwiper }}
      updateOnWindowResize
      allowTouchMove
      className="!w-full !overflow-visible"
    >
      {slides.map((day: WeekDayProps, i: number) => (
        <SwiperSlide className={cn('flex w-full aspect-[217/275]')} key={`${day.id}-mobile-${i}`}>
          <DayCard day={day} />
        </SwiperSlide>
      ))}
    </Swiper>
  </div>
)

export default LW15MainStage
