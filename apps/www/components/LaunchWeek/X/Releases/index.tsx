import Image from 'next/image'
import Link from 'next/link'
import { Accordion, cn } from 'ui'
import { useBreakpoint } from 'common/hooks/useBreakpoint'

import { CartTitle, CheckCircleSolidIcon, DayLink } from './components'
import SectionContainer from '~/components/Layouts/SectionContainer'
import days, { WeekDayProps } from './lwx_data'

export default function LW8Releases() {
  const [day1, day2, day3, day4, day5] = days
  const isTablet = useBreakpoint(1023)
  const isDesktop = useBreakpoint(1280)
  const showAll = false
  const publishedSections =
    days
      .filter(
        (day: WeekDayProps) => Date.parse(day.published_at) <= Date.now() || day.shipped || showAll
      )
      .map((day: WeekDayProps) => day.d.toString()) ?? []

  return (
    <>
      <SectionContainer className="!w-full !px-0 !max-w-none">
        {days.map((day) => (
          <div
            key={day.dd}
            id={day.isToday ? 'today' : undefined}
            className="border-b py-8 first:border-t border-[#111718] scroll-mt-20 grid gap-3 md:grid-cols-3"
          >
            <div className="flex h-full flex-col gap-4 items-between text-foreground-muted">
              <div className="text-xs inline sm:hidden md:inline uppercase font-mono text-foreground">
                {day.dd}, {day.date}
              </div>
              <div className="flex-1 flex flex-col justify-end">
                <ul className="">
                  {day.links?.map((link) => (
                    <li key={link.href}>
                      <DayLink {...link}></DayLink>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {day.steps.length > 0 && (
              <div className="flex flex-col gap-5 lg:flex-row col-span-2">
                <div
                  className={`
                        min-h-[400px] relative overflow-hidden group/d1 flex-1 flex flex-col items-center lg:items-start justify-between
                        basis-1/2 lg:basis-1/3 border border-[#111718] rounded-xl lg:h-full bg-no-repeat py-10 lg:py-12 px-8 lg:px-10 text-2xl bg-contain shadow-lg
                        `}
                >
                  <div className="inset-0 bg-[#121516] absolute group-hover/d1:scale-105 opacity-60 group-hover/d1:opacity-100 w-full h-full -z-10 transition-colors pointer-events-none" />
                  <div className="flex flex-col items-center lg:items-start gap-2 min-w-[300px] w-full text-center lg:text-left">
                    <Link href={day.steps[0].blog!} className="m-0">
                      <CartTitle>{day.steps[0].title}</CartTitle>
                    </Link>
                    <p className="text-sm text-slate-900">{day.steps[0]?.description}</p>
                  </div>
                  {/* <SectionButtons blog={day.steps[0].blog} hackernews={day.steps[0].hackernews} /> */}
                  {day.steps[0]?.bg_layers &&
                    day.steps[0]?.bg_layers?.map(
                      (layer, i) =>
                        !!layer.img && (
                          <div className="absolute opacity-90 transition-opacity inset-0 w-full h-full -z-10 group-hover/d1:opacity-100">
                            <Image
                              src={
                                !!layer.mobileImg && isTablet ? (layer.mobileImg as any) : layer.img
                              }
                              className={`
                                    absolute opacity-90 object-contain
                                    w-full h-full -z-10 transition-all duration-300
                                  `}
                              fill
                              objectPosition={isTablet ? '50%' : '90% 50%'}
                              alt=""
                            />
                          </div>
                        )
                    )}
                </div>
              </div>
            )}
          </div>
        ))}
      </SectionContainer>
    </>
  )
}
