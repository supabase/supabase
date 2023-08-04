import Image from 'next/image'
import { motion } from 'framer-motion'
import { Accordion } from 'ui'
import { useBreakpoint } from 'common/hooks/useBreakpoint'

import days, { WeekDayProps } from './lw8_data'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { AccordionHeader, CartTitle, SectionButtons } from './components'

export const defaultEase = [0.25, 0.25, 0, 1]
export const defaultDuratonIn = 0.25
export const defaultDuratonOut = 0.1

export const opacityVariant = {
  default: { opacity: 0.9, ease: defaultEase, duration: defaultDuratonOut },
  hover: {
    opacity: 1,
    transition: {
      duration: defaultDuratonIn,
      ease: defaultEase,
    },
  },
}
export const opacityVariant2 = {
  default: { opacity: 0, ease: defaultEase, duration: defaultDuratonOut },
  hover: {
    opacity: 0.2,
    transition: {
      duration: defaultDuratonIn,
      ease: defaultEase,
    },
  },
}
export const opacityVariant3 = {
  default: { opacity: 0, ease: defaultEase, duration: defaultDuratonOut },
  hover: {
    opacity: 1,
    transition: {
      duration: defaultDuratonIn,
      ease: defaultEase,
    },
  },
}
export const opacityVariant4 = {
  default: { opacity: 0.3, ease: defaultEase, duration: defaultDuratonOut },
  hover: {
    opacity: 1,
    transition: {
      duration: defaultDuratonIn,
      ease: defaultEase,
    },
  },
}
export const scaleOpacityVariant = {
  default: { scale: 1, opacity: 0.9, ease: defaultEase, duration: defaultDuratonOut },
  hover: {
    scale: 1.05,
    opacity: 1,
    transition: {
      duration: defaultDuratonIn,
      ease: defaultEase,
    },
  },
}
export const scaleOpacityVariant2 = {
  default: { scale: 1, opacity: 0.8, ease: defaultEase, duration: defaultDuratonOut },
  hover: {
    scale: 1.025,
    opacity: 1,
    transition: {
      duration: defaultDuratonIn,
      ease: defaultEase,
    },
  },
}
export const aiImageMobileVariant = {
  default: { scale: 0.9 },
  hover: {
    scale: 0.9,
  },
}
export const moveX10 = {
  default: { x: 0, ease: defaultEase, duration: defaultDuratonOut },
  hover: {
    x: 10,
    transition: {
      duration: defaultDuratonIn,
      ease: defaultEase,
    },
  },
}

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

  const day1Shipped = true
  const day2Shipped = Date.parse(day2.publishedAt) <= Date.now()
  const day3Shipped = Date.parse(day3.publishedAt) <= Date.now()
  const day4Shipped = Date.parse(day4.publishedAt) <= Date.now()
  const day5Shipped = Date.parse(day5.publishedAt) <= Date.now()

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
                  <motion.div
                    className={`
                      min-h-[400px] relative overflow-hidden group/pre0 flex-1 flex flex-col items-center justify-between
                      basis-1/2 lg:basis-1/3 border border-[#111718] rounded-xl lg:h-full bg-no-repeat py-10 lg:py-12 px-8 lg:px-10 text-2xl bg-contain shadow-lg
                      `}
                    initial="default"
                    animate="default"
                    whileHover="hover"
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
                            <motion.div
                              className="absolute opacity-90 inset-0 w-full h-full -z-10"
                              variants={i === 1 ? scaleOpacityVariant : undefined}
                            >
                              <Image
                                src={
                                  !!layer.mobileImg && isTablet
                                    ? (layer.mobileImg as any)
                                    : layer.img
                                }
                                className={`
                                  absolute opacity-90
                                  w-full h-full -z-10 transition-all duration-300
                                `}
                                layout="fill"
                                objectPosition="100%"
                                objectFit="cover"
                              />
                            </motion.div>
                          )
                      )}
                  </motion.div>
                  <motion.div
                    className={`
                      min-h-[400px] relative overflow-hidden group/pre1 flex-1 flex flex-col items-center justify-between
                      basis-1/2 lg:basis-1/3 border border-[#111718] rounded-xl lg:h-full bg-no-repeat py-10 lg:py-12 px-8 lg:px-10 text-2xl bg-cover shadow-lg
                      `}
                    initial="default"
                    animate="default"
                    whileHover="hover"
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
                            <motion.div
                              className="absolute opacity-90 inset-0 w-full h-full -z-10"
                              variants={i === 1 ? scaleOpacityVariant : undefined}
                            >
                              <Image
                                src={
                                  !!layer.mobileImg && isTablet
                                    ? (layer.mobileImg as any)
                                    : layer.img
                                }
                                className={`
                                  absolute opacity-90
                                  w-full h-full -z-10 transition-all duration-300
                                `}
                                layout="fill"
                                objectPosition="20% 50%"
                                objectFit="cover"
                              />
                            </motion.div>
                          )
                      )}
                  </motion.div>
                  <motion.div
                    className={`
                      min-h-[400px] relative overflow-hidden group/pre2 flex-1 flex flex-col items-center justify-between
                      basis-1/2 lg:basis-1/3 border border-[#111718] rounded-xl lg:h-full bg-no-repeat py-10 lg:py-12 px-8 lg:px-10 text-2xl bg-contain shadow-lg
                      `}
                    initial="default"
                    animate="default"
                    whileHover="hover"
                  >
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
                            <motion.div
                              className="absolute opacity-90 inset-0 w-full h-full -z-10"
                              variants={i === 1 ? scaleOpacityVariant : undefined}
                            >
                              <Image
                                src={
                                  !!layer.mobileImg && isTablet
                                    ? (layer.mobileImg as any)
                                    : layer.img
                                }
                                className={`
                                  absolute opacity-90
                                  w-full h-full -z-10 transition-all duration-300
                                `}
                                layout="fill"
                                objectPosition={
                                  isTablet ? '50%' : isDesktop ? '100% 50%' : '30% 50%'
                                }
                                objectFit="contain"
                              />
                            </motion.div>
                          )
                      )}
                  </motion.div>
                </div>
              )}
            </Accordion.Item>
          </div>
          <div className="border-b border-[#111718] scroll-mt-16" id="today">
            <Accordion.Item
              header={
                <AccordionHeader
                  date={day1.date}
                  day={day1.d}
                  weekDay={day1.dd}
                  title={day1.title}
                  shipped={day1Shipped}
                  publishedAt={day1.publishedAt}
                />
              }
              disabled={true}
              className="h-[79px] hover:cursor-default"
              id={day1.d.toString()}
            >
              {day1.steps.length > 0 && (
                <div className="flex flex-col gap-5 lg:flex-row pb-4">
                  <motion.div
                    className={`
                      min-h-[400px] relative overflow-hidden group/d1 flex-1 flex flex-col items-center lg:items-start justify-between
                      basis-1/2 lg:basis-1/3 border border-[#111718] rounded-xl lg:h-full bg-no-repeat py-10 lg:py-12 px-8 lg:px-10 text-2xl bg-contain shadow-lg
                      `}
                    initial="default"
                    animate="default"
                    whileHover="hover"
                  >
                    <div
                      className="inset-0 absolute group-hover/d1:scale-105 opacity-60 group-hover/d1:opacity-100 w-full h-full -z-10 transition-all duration-500 pointer-events-none"
                      style={{
                        background: `radial-gradient(100% 100% at 80% 110%, #6F13A450, #030A0C)`,
                      }}
                    />
                    <div className="flex flex-col items-center lg:items-start gap-2 min-w-[300px] w-full text-center lg:text-left">
                      <CartTitle>{day1.steps[0].title}</CartTitle>
                      <p className="text-sm text-slate-900">{day1.steps[0]?.description}</p>
                    </div>
                    <SectionButtons
                      blog={day1.steps[0].blog}
                      hackernews={day1.steps[0].hackernews}
                      twitter_spaces={day1.steps[0].twitter_spaces}
                      mobileGrid
                    />
                    {day1.steps[0]?.bg_layers &&
                      day1.steps[0]?.bg_layers?.map(
                        (layer, i) =>
                          !!layer.img && (
                            <motion.div
                              className="absolute opacity-90 inset-0 w-full h-full -z-10"
                              variants={i === 1 ? scaleOpacityVariant : undefined}
                            >
                              <Image
                                src={
                                  !!layer.mobileImg && isTablet
                                    ? (layer.mobileImg as any)
                                    : layer.img
                                }
                                className={`
                                  absolute opacity-90
                                  w-full h-full -z-10 transition-all duration-300
                                `}
                                layout="fill"
                                objectPosition={isTablet ? '50%' : '90% 50%'}
                                objectFit="contain"
                              />
                            </motion.div>
                          )
                      )}
                  </motion.div>
                </div>
              )}
            </Accordion.Item>
          </div>
          <div className="border-b border-[#111718]">
            <Accordion.Item
              header={
                <AccordionHeader
                  date={day2.date}
                  day={day2.d}
                  weekDay={day2.dd}
                  title={day2.title}
                  shipped={day2Shipped}
                  publishedAt={day2.publishedAt}
                />
              }
              disabled={!day2Shipped}
              className="h-[79px]"
              id={day2.d.toString()}
            ></Accordion.Item>
          </div>
          <div className="border-b border-[#111718]">
            <Accordion.Item
              header={
                <AccordionHeader
                  date={day3.date}
                  day={day3.d}
                  weekDay={day3.dd}
                  title={day3.title}
                  shipped={day3Shipped}
                  publishedAt={day3.publishedAt}
                />
              }
              disabled={!day3Shipped}
              className="h-[79px]"
              id={day3.d.toString()}
            ></Accordion.Item>
          </div>
          <div className="border-b border-[#111718]">
            <Accordion.Item
              header={
                <AccordionHeader
                  date={day4.date}
                  day={day4.d}
                  weekDay={day4.dd}
                  title={day4.title}
                  shipped={day4Shipped}
                  publishedAt={day4.publishedAt}
                />
              }
              disabled={!day4Shipped}
              className="h-[79px]"
              id={day4.d.toString()}
            ></Accordion.Item>
          </div>
          <div className="border-b border-[#111718]">
            <Accordion.Item
              header={
                <AccordionHeader
                  date={day5.date}
                  day={day5.d}
                  weekDay={day5.dd}
                  title={day5.title}
                  shipped={day5Shipped}
                  publishedAt={day5.publishedAt}
                />
              }
              disabled={!day5Shipped}
              className="h-[79px]"
              id={day5.d.toString()}
            ></Accordion.Item>
          </div>
        </Accordion>
      </SectionContainer>
    </>
  )
}
