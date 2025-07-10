import 'swiper/css'
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from 'ui'
import { useTheme } from 'next-themes'
import { Swiper, SwiperSlide } from 'swiper/react'

import SectionContainer from 'components/Layouts/SectionContainer'
import { mainDays, WeekDayProps } from './data'

const LW15MainStage = ({ className }: { className?: string }) => {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme?.includes('dark')
  const days = mainDays(isDark!)

  return (
    <div className="relative pb-16 md:pb-24 lg:pb-24">
      <SectionContainer
        className={cn(
          'relative !max-w-none !pb-4 md:pb-4 !pt-8 xl:!pt-10 xl:!container flex flex-col gap-4',
          className
        )}
        id="main-stage"
      >
        <h3 className="text-2xl lg:text-3xl">Main Stage</h3>
        <div className="hidden xl:flex flex-nowrap justify-between gap-2">
          {days.map((day) => (
            <DayCard day={day} key={day.dd} />
          ))}
        </div>
      </SectionContainer>
      <CardsSlider slides={days} className="xl:hidden" />
    </div>
  )
}

const DayCard = ({ day }: { day: WeekDayProps }) => (
  <Link
    href={day.blog!}
    className={cn(
      'group/main block w-full h-full xl:flex-1 xl:h-auto xl:aspect-[217/275] relative overflow-hidden rounded border text-white'
    )}
  >
    <CardBG day={day} />
    <div className="w-full h-full relative z-10 flex flex-col justify-between gap-4 p-4">
      <div>{day.dd}</div>
      <div className="flex flex-col gap-2">
        <span className="text-xs opacity-40">{day.date}</span>
        <h4 className="text-lg leading-snug">{day.title}</h4>
      </div>
    </div>
  </Link>
)

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
                'dark:opacity-40 scale-100',
                'group-hover/main:dark:opacity-100 group-hover/main:scale-[104%]'
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
    <div className="absolute inset-0 z-0 w-full h-full bg-gradient-to-b from-black/30 to-black/90" />
  </div>
)

interface Props {
  className?: string
  slides: WeekDayProps[]
}

const CardsSlider: React.FC<Props> = ({ slides, className }) => (
  <div className={cn('relative px-6 lg:px-16', className)}>
    <Swiper
      initialSlide={0}
      spaceBetween={12}
      slidesPerView={1.5}
      breakpoints={{
        540: {
          slidesPerView: 2.5,
        },
        720: {
          slidesPerView: 3.5,
        },
        960: {
          slidesPerView: 4.5,
        },
      }}
      speed={400}
      watchOverflow
      threshold={2}
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
