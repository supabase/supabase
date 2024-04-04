import Image from 'next/image'
import Link from 'next/link'
import { Accordion, cn } from 'ui'
import { useBreakpoint } from 'common/hooks/useBreakpoint'

import {
  AccordionHeader,
  CartTitle,
  CheckCircleSolidIcon,
  MultistepSectionHeader,
  SectionButtons,
} from './components'
import SectionContainer from '~/components/Layouts/SectionContainer'
import days, { WeekDayProps } from './lw8_data'

export default function LW8Releases() {
  const [preRelease, day1, day2, day3, day4, day5] = days
  const isTablet = useBreakpoint(1023)
  const isDesktop = useBreakpoint(1280)
  const showAll = false
  const publishedSections =
    days
      .filter(
        (day: WeekDayProps) => Date.parse(day.publishedAt) <= Date.now() || day.shipped || showAll
      )
      .map((day: WeekDayProps) => day.d.toString()) ?? []

  return (
    <>
      <SectionContainer className="!pt-0 !w-full !px-0 !max-w-none">
        <Accordion
          type="default"
          openBehaviour="multiple"
          size="large"
          className="text-white"
          justified={false}
          chevronAlign="right"
          defaultValue={publishedSections}
        >
          <div className="border-b border-[#111718]">
            <Accordion.Item
              header={
                <AccordionHeader
                  date={preRelease.date}
                  day={preRelease.d}
                  weekDay={preRelease.dd}
                  title={preRelease.title}
                  shipped={true}
                  shippable={false}
                  publishedAt={preRelease.publishedAt}
                />
              }
              key={preRelease.dd}
              className="h-[79px]"
              id={preRelease.d.toString()}
            >
              {preRelease.steps.length > 0 && (
                <div className="flex flex-col gap-5 lg:flex-row pb-4">
                  <div
                    className={`
                      min-h-[400px] relative overflow-hidden group/pre0 flex-1 flex flex-col items-center justify-between
                      basis-1/2 lg:basis-1/3 border border-[#111718] rounded-xl lg:h-full bg-no-repeat py-10 lg:py-12 px-8 lg:px-10 text-2xl bg-contain shadow-lg
                      `}
                  >
                    <div
                      className="inset-0 absolute group-hover/pre0:scale-105 opacity-10 group-hover/pre0:opacity-100 w-full h-full -z-10 transition-all duration-500 pointer-events-none"
                      style={{
                        background: `radial-gradient(100% 100% at 80% 110%, #6F13A490, #030A0C)`,
                      }}
                    />
                    <div className="flex flex-col items-center gap-2 min-w-[300px] w-full text-center lg:text-left">
                      <CartTitle>{preRelease.steps[0].title}</CartTitle>
                      <p className="text-sm text-slate-900">{preRelease.steps[0]?.description}</p>
                    </div>
                    <SectionButtons blog={preRelease.steps[0].blog} />
                    {preRelease.steps[0]?.bg_layers &&
                      preRelease.steps[0]?.bg_layers?.map(
                        (layer, i) =>
                          !!layer.img && (
                            <div
                              key={layer.img}
                              className="absolute opacity-90 transition-opacity inset-0 w-full h-full -z-10 group-hover/d1:opacity-100"
                            >
                              <Image
                                src={
                                  !!layer.mobileImg && isTablet
                                    ? (layer.mobileImg as any)
                                    : layer.img
                                }
                                className={`
                                  absolute opacity-90
                                  w-full h-full -z-10 transition-all duration-300 object-[100%] object-cover
                                `}
                                fill
                                sizes="100%"
                                alt=""
                              />
                            </div>
                          )
                      )}
                  </div>
                  <div
                    className={`
                      min-h-[400px] relative overflow-hidden group/pre1 flex-1 flex flex-col items-center justify-between
                      basis-1/2 lg:basis-1/3 border border-[#111718] rounded-xl lg:h-full bg-no-repeat py-10 lg:py-12 px-8 lg:px-10 text-2xl bg-cover shadow-lg
                      `}
                  >
                    <div
                      className="inset-0 absolute group-hover/pre1:scale-105 opacity-60 group-hover/pre1:opacity-100 w-full h-full -z-10 transition-all duration-500 pointer-events-none"
                      style={{
                        background: `radial-gradient(100% 100% at 80% 110%, #6F13A450, #030A0C)`,
                      }}
                    />
                    <div className="flex flex-col items-center gap-2 min-w-[300px] w-full text-center lg:text-left">
                      <CartTitle>{preRelease.steps[1].title}</CartTitle>
                      <p className="text-sm text-slate-900">{preRelease.steps[1]?.description}</p>
                    </div>
                    <SectionButtons
                      github={preRelease.steps[1].github}
                      hackernews={preRelease.steps[1].hackernews}
                    />
                    {preRelease.steps[1]?.bg_layers &&
                      preRelease.steps[1]?.bg_layers?.map(
                        (layer, i) =>
                          !!layer.img && (
                            <div
                              key={layer.img}
                              className="absolute opacity-90 transition-opacity inset-0 w-full h-full -z-10 group-hover/d1:opacity-100"
                            >
                              <Image
                                src={
                                  !!layer.mobileImg && isTablet
                                    ? (layer.mobileImg as any)
                                    : layer.img
                                }
                                className={`
                                  absolute opacity-90
                                  w-full h-full -z-10 transition-all duration-300 object-[20%_50%] object-cover
                                `}
                                fill
                                sizes="100%"
                                alt=""
                              />
                            </div>
                          )
                      )}
                  </div>
                  <div
                    className={`
                      min-h-[400px] relative overflow-hidden group/pre2 flex-1 flex flex-col items-center justify-between
                      basis-1/2 lg:basis-1/3 border border-[#111718] rounded-xl lg:h-full bg-no-repeat py-10 lg:py-12 px-8 lg:px-10 text-2xl bg-contain shadow-lg
                      `}
                  >
                    {' '}
                    <div
                      className="inset-0 absolute group-hover/pre2:scale-105 opacity-60 group-hover/pre2:opacity-100 w-full h-full -z-10 transition-all duration-500 pointer-events-none"
                      style={{
                        background: `radial-gradient(100% 100% at 80% 110%, #6F13A450, #030A0C)`,
                      }}
                    />
                    <div className="flex flex-col items-center gap-2 w-full text-center">
                      <CartTitle>{preRelease.steps[2].title}</CartTitle>
                      <p className="text-sm text-slate-900">{preRelease.steps[2]?.description}</p>
                    </div>
                    <SectionButtons blog={preRelease.steps[2].blog} />
                    {preRelease.steps[2]?.bg_layers &&
                      preRelease.steps[2]?.bg_layers?.map(
                        (layer, i) =>
                          !!layer.img && (
                            <div
                              key={layer.img}
                              className="absolute opacity-90 transition-opacity inset-0 w-full h-full -z-10 group-hover/d1:opacity-100"
                            >
                              <Image
                                src={layer.img}
                                className={cn(
                                  `
                                  absolute opacity-90
                                  w-full h-full -z-10 transition-all duration-300 object-contain
                                `,
                                  isTablet
                                    ? 'object-[50%]'
                                    : isDesktop
                                      ? 'object-[100%_50%]'
                                      : 'object-[30%_50%]'
                                )}
                                fill
                                sizes="100%"
                                alt=""
                              />
                            </div>
                          )
                      )}
                  </div>
                </div>
              )}
            </Accordion.Item>
          </div>
          <div className="border-b border-[#111718] scroll-mt-16">
            <AccordionHeader
              date={day1.date}
              day={day1.d}
              weekDay={day1.dd}
              title={day1.title}
              shipped={day1.shipped}
              publishedAt={day1.publishedAt}
              youtube_id={day1.youtube_id}
              videoThumbnail={day1.videoThumbnail}
            />

            {day1.steps.length > 0 && (
              <div className="flex flex-col gap-5 lg:flex-row pb-4">
                <div
                  className={`
                      min-h-[400px] relative overflow-hidden group/d1 flex-1 flex flex-col items-center lg:items-start justify-between
                      basis-1/2 lg:basis-1/3 border border-[#111718] rounded-xl lg:h-full bg-no-repeat py-10 lg:py-12 px-8 lg:px-10 text-2xl bg-contain shadow-lg
                      `}
                >
                  <div
                    className="inset-0 absolute group-hover/d1:scale-105 opacity-60 group-hover/d1:opacity-100 w-full h-full -z-10 transition-all duration-500 pointer-events-none"
                    style={{
                      background: `radial-gradient(100% 100% at 80% 80%, #6F13A450, #030A0C)`,
                    }}
                  />
                  <div className="flex flex-col items-center lg:items-start gap-2 min-w-[300px] w-full text-center lg:text-left">
                    <Link href={day1.steps[0].blog!} className="m-0">
                      <CartTitle>{day1.steps[0].title}</CartTitle>
                    </Link>
                    <p className="text-sm text-slate-900">{day1.steps[0]?.description}</p>
                  </div>
                  <SectionButtons blog={day1.steps[0].blog} hackernews={day1.steps[0].hackernews} />
                  {day1.steps[0]?.bg_layers &&
                    day1.steps[0]?.bg_layers?.map(
                      (layer, i) =>
                        !!layer.img && (
                          <div
                            key={layer.img}
                            className="absolute opacity-90 transition-opacity inset-0 w-full h-full -z-10 group-hover/d1:opacity-100"
                          >
                            <Image
                              src={
                                !!layer.mobileImg && isTablet ? (layer.mobileImg as any) : layer.img
                              }
                              className={cn(
                                `
                                  absolute opacity-90
                                  w-full h-full -z-10 transition-all duration-300 object-contain
                                `,
                                isTablet ? 'object-[50%]' : 'object-[90%_50%]'
                              )}
                              fill
                              sizes="100%"
                              alt=""
                            />
                          </div>
                        )
                    )}
                </div>
              </div>
            )}
          </div>
          <div className="border-b border-[#111718] scroll-mt-16">
            <AccordionHeader
              date={day2.date}
              day={day2.d}
              weekDay={day2.dd}
              title={day2.title}
              shipped={day2.shipped}
              publishedAt={day2.publishedAt}
              youtube_id={day2.youtube_id}
              videoThumbnail={day2.videoThumbnail}
            />

            {day2.steps.length > 0 && (
              <div className="flex flex-col gap-5 lg:flex-row pb-4">
                <div
                  className={`
                      min-h-[400px] relative overflow-hidden group/d1 flex-1 flex flex-col items-center lg:items-start justify-between
                      basis-1/2 lg:basis-1/3 border border-[#111718] rounded-xl lg:h-full bg-no-repeat py-10 lg:py-12 px-8 lg:px-10 text-2xl bg-contain shadow-lg
                      `}
                >
                  <div
                    className="inset-0 absolute group-hover/d1:scale-105 opacity-60 group-hover/d1:opacity-100 w-full h-full -z-10 transition-all duration-500 pointer-events-none"
                    style={{
                      background: `radial-gradient(100% 100% at 80% 80%, #6F13A450, #030A0C)`,
                    }}
                  />
                  <div className="flex flex-col items-center lg:items-start gap-2 min-w-[300px] w-full text-center lg:text-left">
                    <Link href={day2.steps[0].blog!} className="m-0">
                      <CartTitle>{day2.steps[0].title}</CartTitle>
                    </Link>
                    <p className="text-sm text-slate-900">{day2.steps[0]?.description}</p>
                  </div>
                  <SectionButtons blog={day2.steps[0].blog} hackernews={day2.steps[0].hackernews} />
                  {day2.steps[0]?.bg_layers &&
                    day2.steps[0]?.bg_layers?.map(
                      (layer, i) =>
                        !!layer.img && (
                          <div
                            key={layer.img}
                            className="absolute opacity-90 transition-opacity inset-0 w-full h-full -z-10 group-hover/d1:opacity-100"
                          >
                            <Image
                              src={
                                !!layer.mobileImg && isTablet ? (layer.mobileImg as any) : layer.img
                              }
                              className={`
                                  absolute opacity-90
                                  w-full h-full -z-10 transition-all duration-300 object-cover
                                `}
                              fill
                              sizes="100%"
                              alt=""
                            />
                          </div>
                        )
                    )}
                </div>
              </div>
            )}
          </div>
          <div className="border-b border-[#111718] scroll-mt-16">
            <AccordionHeader
              date={day3.date}
              day={day3.d}
              weekDay={day3.dd}
              title={day3.title}
              shipped={day3.shipped}
              publishedAt={day3.publishedAt}
              youtube_id={day3.youtube_id}
              videoThumbnail={day3.videoThumbnail}
            />

            {day3.steps.length > 0 && (
              <div className="flex flex-col gap-5 lg:flex-row pb-4">
                <div
                  className={`
                      min-h-[400px] relative overflow-hidden group/d1 flex-1 flex flex-col items-center lg:items-start justify-between
                      basis-1/2 lg:basis-1/3 border border-[#111718] rounded-xl lg:h-full bg-no-repeat py-10 lg:py-12 px-8 lg:px-10 text-2xl bg-contain shadow-lg
                      `}
                >
                  <div
                    className="inset-0 absolute group-hover/d1:scale-105 opacity-60 group-hover/d1:opacity-100 w-full h-full -z-10 transition-all duration-500 pointer-events-none"
                    style={{
                      background: `radial-gradient(100% 100% at 80% 80%, #6F13A450, #030A0C)`,
                    }}
                  />
                  <div className="flex flex-col items-center lg:items-start gap-2 min-w-[300px] w-full text-center lg:text-left">
                    <Link href={day3.steps[0].blog!} className="m-0">
                      <CartTitle>{day3.steps[0].title}</CartTitle>
                    </Link>
                    <p className="text-sm text-slate-900">{day3.steps[0]?.description}</p>
                    <ul className="flex flex-row flex-wrap lg:flex-col gap-2 text-sm md:text-base justify-center">
                      <li className="flex items-center gap-2">
                        <CheckCircleSolidIcon /> AI SQL Editor
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircleSolidIcon /> Schema Diagrams
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircleSolidIcon /> Wrappers
                      </li>
                    </ul>
                  </div>
                  <SectionButtons
                    blog={day3.steps[0].blog}
                    product_hunt={day3.steps[0].product_hunt}
                  />
                  {day3.steps[0]?.bg_layers &&
                    day3.steps[0]?.bg_layers?.map(
                      (layer, i) =>
                        !!layer.img && (
                          <div
                            key={layer.img}
                            className="absolute opacity-90 transition-opacity inset-0 w-full h-full -z-10 group-hover/d1:opacity-100"
                          >
                            <Image
                              src={
                                !!layer.mobileImg && isTablet ? (layer.mobileImg as any) : layer.img
                              }
                              className={cn(
                                'absolute opacity-90 w-full h-full -z-10 transition-all duration-300',
                                isTablet ? 'object-[50%]' : 'object-[100%_50%]',
                                i == 1 && isTablet ? 'object-contain' : 'object-cover'
                              )}
                              fill
                              sizes="100%"
                              alt=""
                            />
                          </div>
                        )
                    )}
                </div>
              </div>
            )}
          </div>
          <div className="border-b border-[#111718] scroll-mt-16">
            <AccordionHeader
              date={day4.date}
              day={day4.d}
              weekDay={day4.dd}
              title={day4.title}
              shipped={day4.shipped}
              publishedAt={day4.publishedAt}
              youtube_id={day4.youtube_id}
              videoThumbnail={day4.videoThumbnail}
            />

            {day4.steps.length > 0 && (
              <div className="flex flex-col gap-5 lg:flex-row pb-4">
                <div
                  className={`
                      min-h-[400px] relative overflow-hidden group/d1 flex-1 flex flex-col items-center lg:items-start justify-between
                      basis-1/2 lg:flex-shrink xl:basis-2/3 border border-[#111718] rounded-xl lg:h-full bg-no-repeat py-10 lg:py-12 px-8 lg:px-10 text-2xl bg-contain shadow-lg
                      `}
                >
                  <div
                    className="inset-0 absolute group-hover/d1:scale-105 opacity-60 group-hover/d1:opacity-100 w-full h-full -z-10 transition-all duration-500 pointer-events-none"
                    style={{
                      background: `radial-gradient(100% 100% at 80% 80%, #6F13A450, #030A0C)`,
                    }}
                  />
                  <div className="flex flex-col items-center lg:items-start gap-2 min-w-[300px] w-full text-center lg:text-left">
                    <Link href={day4.steps[0].blog!} className="m-0">
                      <CartTitle>{day4.steps[0].title}</CartTitle>
                    </Link>
                    <p className="text-sm text-slate-900">{day4.steps[0]?.description}</p>
                  </div>
                  <SectionButtons blog={day4.steps[0].blog} />
                  {day4.steps[0]?.bg_layers &&
                    day4.steps[0]?.bg_layers?.map(
                      (layer, i) =>
                        !!layer.img && (
                          <div
                            key={layer.img}
                            className="absolute opacity-90 transition-opacity inset-0 w-full h-full -z-10 group-hover/d1:opacity-100"
                          >
                            <Image
                              src={
                                !!layer.mobileImg && isTablet ? (layer.mobileImg as any) : layer.img
                              }
                              className={cn(
                                'absolute opacity-90 w-full h-full -z-10 transition-all duration-300',
                                isTablet ? 'object-[50%]' : 'object-[100%_50%]',
                                i == 1 && isTablet ? 'object-contain' : 'object-cover'
                              )}
                              fill
                              sizes="100%"
                              alt=""
                            />
                          </div>
                        )
                    )}
                </div>
                <div
                  className={`
                      min-h-[400px] relative overflow-hidden group/d1 flex-1 flex flex-col items-center justify-between
                      basis-1/2 lg:basis-1/3 border border-[#111718] rounded-xl lg:h-full bg-no-repeat py-10 lg:py-12 px-8 lg:px-10 text-2xl bg-contain shadow-lg
                      `}
                >
                  <div
                    className="inset-0 absolute group-hover/d1:scale-105 opacity-60 group-hover/d1:opacity-100 w-full h-full -z-10 transition-all duration-500 pointer-events-none"
                    style={{
                      background: `radial-gradient(100% 100% at 80% 80%, #6F13A450, #030A0C)`,
                    }}
                  />
                  <div className="flex flex-col items-center gap-2 min-w-[300px] w-full text-center lg:text-left">
                    <Link href={day4.steps[1].blog!} className="m-0">
                      <CartTitle>{day4.steps[1].title}</CartTitle>
                    </Link>
                    <p className="text-sm text-slate-900">{day4.steps[1]?.description}</p>
                  </div>
                  <SectionButtons blog={day4.steps[1].blog} />
                  {day4.steps[1]?.bg_layers &&
                    day4.steps[1]?.bg_layers?.map(
                      (layer, i) =>
                        !!layer.img && (
                          <div
                            key={layer.img}
                            className="absolute opacity-90 transition-opacity inset-0 w-full h-full -z-10 group-hover/d1:opacity-100"
                          >
                            <Image
                              src={
                                !!layer.mobileImg && isTablet ? (layer.mobileImg as any) : layer.img
                              }
                              className="absolute opacity-90 w-full h-full -z-10 transition-all duration-300 object-cover"
                              fill
                              sizes="100%"
                              alt=""
                            />
                          </div>
                        )
                    )}
                </div>
              </div>
            )}
          </div>
          <div className="border-b border-[#111718] scroll-mt-16">
            <AccordionHeader
              date={day5.date}
              day={day5.d}
              weekDay={day5.dd}
              title={day5.title}
              shipped={day5.shipped}
              publishedAt={day5.publishedAt}
              youtube_id={day5.youtube_id}
              videoThumbnail={day5.videoThumbnail}
            />

            {day5.steps.length > 0 && (
              <div className="flex flex-col pb-4">
                <div
                  className={`
                      min-h-[400px] relative overflow-hidden group/d1 flex-1 flex flex-col items-center lg:items-start justify-between
                      border border-[#111718] rounded-xl lg:h-full bg-no-repeat py-10 lg:py-12 px-8 lg:px-10 text-2xl bg-contain shadow-lg
                      `}
                >
                  <div
                    className="inset-0 absolute group-hover/d1:scale-105 opacity-60 group-hover/d1:opacity-100 w-full h-full -z-10 transition-all duration-500 pointer-events-none"
                    style={{
                      background: `radial-gradient(100% 100% at 80% 80%, #6F13A450, #030A0C)`,
                    }}
                  />
                  <div className="flex flex-col items-center lg:items-start gap-2 min-w-[300px] w-full text-center lg:text-left">
                    <Link href={day5.steps[0].blog!} className="m-0">
                      <CartTitle>{day5.steps[0].title}</CartTitle>
                    </Link>
                    <p className="text-sm text-slate-900">{day5.steps[0]?.description}</p>
                  </div>
                  <SectionButtons blog={day5.steps[0].blog} hackernews={day5.steps[0].hackernews} />
                  {day5.steps[0]?.bg_layers &&
                    day5.steps[0]?.bg_layers?.map(
                      (layer, i) =>
                        !!layer.img && (
                          <div
                            key={layer.img}
                            className="absolute opacity-90 transition-opacity inset-0 w-full h-full -z-10 group-hover/d1:opacity-100"
                          >
                            <Image
                              src={
                                !!layer.mobileImg && isTablet ? (layer.mobileImg as any) : layer.img
                              }
                              className="absolute opacity-90 w-full h-full -z-10 transition-all duration-300 object-cover"
                              fill
                              sizes="100%"
                              alt=""
                            />
                          </div>
                        )
                    )}
                </div>
                <MultistepSectionHeader title="Community" />
                <div
                  className={`
                      min-h-[400px] relative overflow-hidden group/d1 flex-1 flex flex-col items-center lg:items-start justify-between
                      border border-[#111718] rounded-xl lg:h-full bg-no-repeat py-10 lg:py-12 px-8 lg:px-10 text-2xl bg-contain shadow-lg
                      `}
                >
                  <div
                    className="inset-0 absolute group-hover/d1:scale-105 opacity-60 group-hover/d1:opacity-100 w-full h-full -z-10 transition-all duration-500 pointer-events-none"
                    style={{
                      background: `radial-gradient(100% 100% at 80% 80%, #6F13A450, #030A0C)`,
                    }}
                  />
                  <div className="flex flex-col items-center lg:items-start gap-2 min-w-[300px] w-full text-center lg:text-left">
                    <Link href={day5.steps[1].blog!} className="m-0">
                      <CartTitle>{day5.steps[1].title}</CartTitle>
                    </Link>
                    <p className="text-sm text-slate-900">{day5.steps[1]?.description}</p>
                  </div>
                  <SectionButtons blog={day5.steps[1].blog} hackernews={day5.steps[1].hackernews} />
                  {day5.steps[1]?.bg_layers &&
                    day5.steps[1]?.bg_layers?.map(
                      (layer, i) =>
                        !!layer.img && (
                          <div
                            key={layer.img}
                            className="absolute opacity-90 transition-opacity inset-0 w-full h-full -z-10 group-hover/d1:opacity-100"
                          >
                            <Image
                              src={
                                !!layer.mobileImg && isTablet ? (layer.mobileImg as any) : layer.img
                              }
                              className="absolute opacity-90 w-full h-full -z-10 transition-all duration-300 object-cover"
                              fill
                              sizes="100%"
                              alt=""
                            />
                          </div>
                        )
                    )}
                </div>
                <MultistepSectionHeader title="One more thing" />
                <div
                  className={`
                      min-h-[400px] relative overflow-hidden group/d1 flex-1 flex flex-col items-center lg:items-start justify-between
                      border border-[#111718] rounded-xl lg:h-full bg-no-repeat py-10 lg:py-12 px-8 lg:px-10 text-2xl bg-contain shadow-lg
                      `}
                >
                  <div
                    className="inset-0 absolute group-hover/d1:scale-105 opacity-60 group-hover/d1:opacity-100 w-full h-full -z-10 transition-all duration-500 pointer-events-none"
                    style={{
                      background: `radial-gradient(100% 100% at 80% 80%, #6F13A450, #030A0C)`,
                    }}
                  />
                  <div className="flex flex-col items-center lg:items-start gap-2 min-w-[300px] w-full text-center lg:text-left">
                    <Link href={day5.steps[2].blog!} className="m-0">
                      <CartTitle>{day5.steps[2].title}</CartTitle>
                    </Link>
                    <p className="text-sm text-slate-900">{day5.steps[2]?.description}</p>
                  </div>
                  <SectionButtons blog={day5.steps[2].blog} hackernews={day5.steps[0].hackernews} />
                  {day5.steps[2]?.bg_layers &&
                    day5.steps[2]?.bg_layers?.map(
                      (layer, i) =>
                        !!layer.img && (
                          <div
                            key={layer.img}
                            className="absolute opacity-90 transition-opacity inset-0 w-full h-full -z-10 group-hover/d1:opacity-100"
                          >
                            <Image
                              src={
                                !!layer.mobileImg && isTablet ? (layer.mobileImg as any) : layer.img
                              }
                              className={cn(
                                'absolute opacity-90 w-full h-full -z-10 transition-all duration-300 object-cover',
                                isTablet ? 'object-[50%]' : 'object-[100%_50%]'
                              )}
                              fill
                              sizes="100%"
                              alt=""
                            />
                          </div>
                        )
                    )}
                </div>
              </div>
            )}
          </div>
        </Accordion>
      </SectionContainer>
    </>
  )
}
