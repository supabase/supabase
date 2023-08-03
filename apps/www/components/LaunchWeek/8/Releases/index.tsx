import Image from 'next/image'
import { motion } from 'framer-motion'
import { Accordion, Badge } from 'ui'
import { useBreakpoint } from 'common/hooks/useBreakpoint'

import days, { WeekDayProps, endOfLW8 } from './lw8_data'
import SectionContainer from '~/components/Layouts/SectionContainer'
import {
  AccordionHeader,
  CartTitle,
  ChipLink,
  PencilSvg,
  SectionButtons,
  SmallCard,
  StyledArticleBadge,
} from './components'
import Link from 'next/link'

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

const getDay1Motion = (index: number) => {
  switch (index) {
    case 1:
    case 2:
      return moveX10
    case 3:
      return opacityVariant2
    default:
      return undefined
  }
}
const getDay2Motion = (index: number) => {
  switch (index) {
    case 1:
      return opacityVariant3
    default:
      return undefined
  }
}
const getDay3Motion = (index: number) => {
  switch (index) {
    case 1:
      return scaleOpacityVariant
    case 2:
      return opacityVariant3
    default:
      return undefined
  }
}
const getDay4Motion = (index: number) => {
  switch (index) {
    case 0:
      return opacityVariant4
    // case 2:
    //   return opacityVariant3
    default:
      return undefined
  }
}

export default function LW8Releases() {
  const [preRelease, day1, day2, day3, day4, day5] = days
  const isTablet = useBreakpoint(1023)
  const showAll = false
  const publishedSections =
    days
      .filter(
        (day: WeekDayProps) => day.d === 0 || Date.parse(day.publishedAt) <= Date.now() || showAll
      )
      .map((day: WeekDayProps) => day.d.toString()) ?? []

  // const prereleaseShipped = Date.parse(preRelease.publishedAt) <= Date.now()
  const prereleaseShipped = true
  const day1Shipped = Date.parse(day1.publishedAt) <= Date.now()
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
          // bordered={false}
          chevronAlign="right"
          defaultValue={publishedSections}
        >
          <div className="border-b border-[#111718]">
            <Accordion.Item
              header={
                <AccordionHeader
                  date={preRelease.date}
                  day={preRelease.dd}
                  title={preRelease.title}
                  shipped={true}
                  shippable={false}
                  publishedAt={preRelease.publishedAt}
                />
              }
              key={preRelease.dd}
              // disabled={!prereleaseShipped}
              className="h-[79px]"
              id={preRelease.d.toString()}
            >
              {preRelease.steps.length > 0 && (
                <div className="h-[800px] lg:h-[400px] flex flex-col gap-5 lg:flex-row pb-4">
                  <motion.div
                    className={`
                      relative overflow-hidden group/3 flex-1 flex flex-col items-start justify-between
                      basis-1/2 lg:basis-1/3 border border-[#111718] rounded-xl h-full bg-no-repeat py-10 sm:py-14 px-8 lg:px-10 text-2xl bg-contain shadow-lg
                      `}
                    initial="default"
                    animate="default"
                    whileHover="hover"
                  >
                    <div
                      className="inset-0 absolute group-hover/3:scale-105 opacity-60 group-hover/3:opacity-100 w-full h-full -z-10 transition-all duration-500 pointer-events-none"
                      style={{
                        background: `radial-gradient(100% 100% at 80% 110%, #6F13A450, #030A0C)`,
                      }}
                    />
                    <div className="flex flex-col items-start gap-2 min-w-[300px] w-full">
                      <CartTitle>{preRelease.steps[0]?.title}</CartTitle>
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
                                src={layer.img}
                                className={`
                                  absolute opacity-90
                                  w-full h-full -z-10 transition-all duration-300
                                `}
                                layout="fill"
                                objectPosition="80% 50%"
                                objectFit="contain"
                              />
                            </motion.div>
                          )
                      )}
                  </motion.div>
                  {/* <motion.div
                    className={`
                      relative overflow-hidden group/3 flex-1 flex flex-col items-center justify-between
                      basis-1/2 lg:basis-1/3 border border-[#111718] rounded-xl h-full bg-no-repeat py-10 sm:py-14 px-8 lg:px-10 text-2xl bg-contain shadow-lg
                      `}
                    initial="default"
                    animate="default"
                    whileHover="hover"
                  >
                    <div
                      className="top-0 absolute group-hover/3:scale-105 opacity-60 group-hover/3:opacity-100 w-full h-full -z-10 transition-all duration-500"
                      style={{
                        background: `radial-gradient(100% 100% at 80% 110%, #6F13A450, #030A0C)`,
                      }}
                    />
                    <div className="flex flex-col items-center gap-2 min-w-[300px]">
                      <CartTitle>{preRelease.steps[1].title}</CartTitle>
                      <p className="text-sm text-slate-900">{preRelease.steps[1].description}</p>
                    </div>
                    <SectionButtons
                      github={preRelease.steps[1].github}
                      blog={preRelease.steps[1].blog}
                    />
                    {preRelease.steps[1].bg_layers &&
                      preRelease.steps[1].bg_layers?.map(
                        (layer, i) =>
                          !!layer.img && (
                            <motion.div
                              className="absolute opacity-90 inset-0 w-full h-full -z-10"
                              variants={i === 1 ? scaleOpacityVariant : undefined}
                            >
                              <Image
                                src={layer.img}
                                className={`
                                  absolute opacity-90
                                  w-full h-full -z-10 transition-all duration-300
                                `}
                                layout="fill"
                                objectPosition="50% 50%"
                                objectFit="cover"
                              />
                            </motion.div>
                          )
                      )}
                  </motion.div> */}
                </div>
              )}
            </Accordion.Item>
          </div>
          <div className="border-b border-[#111718]">
            <Accordion.Item
              header={
                <AccordionHeader
                  date={day1.date}
                  day={day1.dd}
                  title={day1.title}
                  shipped={day1Shipped}
                  publishedAt={day1.publishedAt}
                />
              }
              disabled={!day1Shipped}
              className="h-[79px]"
              id={day1.d.toString()}
            >
              {day1.steps.length > 0 && (
                <div className="h-[400px] flex flex-col gap-5 lg:flex-row pb-8">
                  <motion.div
                    className={`
                      relative overflow-hidden group/2 flex-1 flex flex-col items-center gap-5 lg:items-start justify-between
                      w-full border border-[#111718] rounded-xl h-full px-4 sm:px-8 lg:px-14 py-14 xs:text-2xl text-xl text-center shadow-lg
                    `}
                    initial="default"
                    animate="default"
                    whileHover="hover"
                  >
                    <div className="flex items-center text-center lg:text-left justify-between flex-col-reverse lg:flex-row lg:justify-start gap-2 text-white">
                      <CartTitle>{day1.steps[0]?.title}</CartTitle>
                      <StyledArticleBadge className="lg:ml-2">New</StyledArticleBadge>
                    </div>
                    <SectionButtons
                      blog={day1.steps[0]?.blog}
                      video={day1.steps[0]?.video}
                      hackernews={day1.steps[0]?.hackernews}
                    />
                    {day1.steps[0]?.bg_layers &&
                      day1.steps[0]?.bg_layers?.map(
                        (layer, i) =>
                          !!layer.img && (
                            <motion.div
                              className={[
                                'absolute inset-0 w-full h-full -z-10',
                                i === 3 && '!mix-blend-overlay blur-2xl',
                              ].join(' ')}
                              variants={getDay1Motion(i)}
                            >
                              <Image
                                src={
                                  !!layer.mobileImg && isTablet
                                    ? (layer.mobileImg as any)
                                    : layer.img
                                }
                                className={[
                                  `
                                  absolute
                                  w-full h-full -z-10 transition-all duration-300
                                `,
                                  i === 5 && '',
                                ].join(' ')}
                                layout="fill"
                                objectPosition={
                                  !!layer.mobileImg && isTablet ? '25% 80%' : '80% 50%'
                                }
                                objectFit="cover"
                                quality={100}
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
                  day={day2.dd}
                  title={day2.title}
                  shipped={day2Shipped}
                  publishedAt={day2.publishedAt}
                />
              }
              disabled={!day2Shipped}
              className="h-[79px]"
              id={day2.d.toString()}
            >
              {day2.steps.length > 0 && (
                <div className="h-[400px] flex flex-col gap-5 lg:flex-row pb-8">
                  <motion.div
                    className={`
                      relative overflow-hidden group/2 flex-1 flex flex-col items-center gap-5 lg:items-start justify-between
                      w-full border rounded-xl h-full px-4 sm:px-8 lg:px-14 py-14 xs:text-2xl text-xl text-center shadow-lg
                    `}
                    initial="default"
                    animate="default"
                    whileHover="hover"
                  >
                    <div className="flex items-center text-center lg:text-left justify-between flex-col-reverse lg:flex-row lg:justify-start gap-2 text-black dark:text-white">
                      <CartTitle>{day2.steps[0]?.title}</CartTitle>
                      <StyledArticleBadge className="lg:ml-2">New</StyledArticleBadge>
                    </div>
                    <SectionButtons
                      blog={day2.steps[0]?.blog}
                      video={day2.steps[0]?.video}
                      hackernews={day2.steps[0]?.hackernews}
                    />
                    {day2.steps[0]?.bg_layers &&
                      day2.steps[0]?.bg_layers?.map(
                        (layer, i) =>
                          !!layer.img && (
                            <motion.div
                              className={[
                                'absolute inset-0 w-full h-full -z-10',
                                i === 3 && '!mix-blend-overlay blur-2xl',
                              ].join(' ')}
                              variants={getDay2Motion(i)}
                            >
                              <Image
                                src={
                                  !!layer.mobileImg && isTablet
                                    ? (layer.mobileImg as any)
                                    : layer.img
                                }
                                className={[
                                  `
                                  absolute
                                  w-full h-full -z-10 transition-all duration-300
                                `,
                                  i === 5 && '',
                                ].join(' ')}
                                layout="fill"
                                objectPosition={
                                  !!layer.mobileImg && isTablet ? '25% 80%' : '80% 50%'
                                }
                                objectFit="cover"
                                quality={100}
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
                  date={day3.date}
                  day={day3.dd}
                  title={day3.title}
                  shipped={day3Shipped}
                  publishedAt={day3.publishedAt}
                />
              }
              disabled={!day3Shipped}
              className="h-[79px]"
              id={day3.d.toString()}
            >
              {day3.steps.length > 0 && (
                <div className="h-[400px] flex flex-col gap-5 lg:flex-row pb-8">
                  <motion.div
                    className={`
                      relative overflow-hidden group/2 flex-1 flex flex-col items-center gap-5 lg:items-start justify-between
                      w-full border rounded-xl h-full px-4 sm:px-8 lg:px-14 py-14 xs:text-2xl text-xl text-center shadow-lg
                    `}
                    initial="default"
                    animate="default"
                    whileHover="hover"
                  >
                    <div className="flex items-center text-center lg:text-left justify-between flex-col-reverse lg:flex-row lg:justify-start gap-2 text-black dark:text-white">
                      <CartTitle>{day3.steps[0]?.title}</CartTitle>
                      <StyledArticleBadge className="lg:ml-2">Updated</StyledArticleBadge>
                    </div>
                    <SectionButtons
                      docs={day3.steps[0]?.docs}
                      blog={day3.steps[0]?.blog}
                      video={day3.steps[0]?.video}
                    />
                    {day3.steps[0]?.bg_layers &&
                      day3.steps[0]?.bg_layers?.map(
                        (layer, i) =>
                          !!layer.img && (
                            <motion.div
                              className={[
                                'absolute inset-0 w-full h-full -z-10',
                                i === 2 && '!mix-blend-overlay blur-2xl',
                              ].join(' ')}
                              variants={getDay3Motion(i)}
                            >
                              <Image
                                src={
                                  !!layer.mobileImg && isTablet
                                    ? (layer.mobileImg as any)
                                    : layer.img
                                }
                                className={[
                                  `
                                  absolute
                                  w-full h-full -z-10 transition-all duration-300
                                `,
                                  i === 5 && '',
                                ].join(' ')}
                                layout="fill"
                                objectPosition={
                                  !!layer.mobileImg && isTablet ? '50% 65%' : '80% 50%'
                                }
                                objectFit={!!layer.mobileImg && isTablet ? 'contain' : 'cover'}
                                quality={100}
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
                  date={day4.date}
                  day={day4.dd}
                  title={day4.title}
                  shipped={day4Shipped}
                  publishedAt={day4.publishedAt}
                />
              }
              disabled={!day4Shipped}
              className="h-[79px]"
              id={day4.d.toString()}
            >
              {day4.steps.length > 0 && (
                <div className="h-[400px] flex flex-col gap-5 lg:flex-row pb-8">
                  <motion.div
                    className={`
                      relative overflow-hidden group/2 flex-1 flex flex-col items-center gap-5 lg:items-start justify-between
                      w-full border rounded-xl h-full px-4 sm:px-8 lg:px-14 py-14 xs:text-2xl text-xl text-center shadow-lg
                    `}
                    initial="default"
                    animate="default"
                    whileHover="hover"
                  >
                    <div className="flex items-center text-center lg:text-left justify-between flex-col-reverse lg:flex-row lg:justify-start gap-2 text-black dark:text-white">
                      <CartTitle>{day4.steps[0]?.title}</CartTitle>
                      <StyledArticleBadge className="lg:ml-2">New</StyledArticleBadge>
                    </div>
                    <SectionButtons
                      docs={day4.steps[0]?.docs}
                      blog={day4.steps[0]?.blog}
                      video={day4.steps[0]?.video}
                      hackernews={day4.steps[0]?.hackernews}
                      mobileGrid
                    />
                    {day4.steps[0]?.bg_layers &&
                      day4.steps[0]?.bg_layers?.map(
                        (layer, i) =>
                          !!layer.img && (
                            <motion.div
                              className={['absolute inset-0 w-full h-full -z-10'].join(' ')}
                              variants={getDay4Motion(i)}
                            >
                              <Image
                                src={
                                  !!layer.mobileImg && isTablet
                                    ? (layer.mobileImg as any)
                                    : layer.img
                                }
                                className={[
                                  `
                                  absolute
                                  w-full h-full -z-10 transition-all duration-300
                                `,
                                ].join(' ')}
                                layout="fill"
                                objectPosition={
                                  !!layer.mobileImg && isTablet ? '50% 65%' : '80% 50%'
                                }
                                objectFit="cover"
                                quality={100}
                              />
                            </motion.div>
                          )
                      )}
                  </motion.div>
                </div>
              )}
            </Accordion.Item>
          </div>
          <div className="border-b border-[#111718]" id="currentDay">
            <Accordion.Item
              header={
                <AccordionHeader
                  date={day5.date}
                  day={day5.dd}
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
