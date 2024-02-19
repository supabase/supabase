import Image from 'next/image'
import { useEffect } from 'react'
import { Accordion } from 'ui'

import days, { WeekDayProps, endOfLW7 } from '~/components/LaunchWeek/7/lw7_days'
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

import { useBreakpoint } from 'common/hooks/useBreakpoint'
import { motion } from 'framer-motion'
import Day5 from './Day5'

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

export default function LW7Releases() {
  const [preRelease, day1, day2, day3, day4, day5] = days
  const isTablet = useBreakpoint(1023)
  const showAll = false
  const publishedSections =
    days
      .filter((day: WeekDayProps) => Date.parse(day.publishedAt) <= Date.now() || showAll)
      .map((day: WeekDayProps) => day.d.toString()) ?? []

  useEffect(() => {
    document.body.className = 'dark bg-[#1C1C1C]'
  }, [])

  const prereleaseShipped = Date.parse(preRelease.publishedAt) <= Date.now()
  const day1Shipped = Date.parse(day1.publishedAt) <= Date.now()
  const day2Shipped = Date.parse(day2.publishedAt) <= Date.now()
  const day3Shipped = Date.parse(day3.publishedAt) <= Date.now()
  const day4Shipped = Date.parse(day4.publishedAt) <= Date.now()
  const day5Shipped = Date.parse(day5.publishedAt) <= Date.now()
  const isHackathonLive = prereleaseShipped && Date.parse(endOfLW7) >= Date.now()

  return (
    <>
      <SectionContainer className="!py-0 w-full !px-0 !max-w-none">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 scroll-mt-[105px]" id="hackathon">
          <SmallCard
            bgGradient
            className={[isHackathonLive && '!from-[#4635A7] !to-[#A69DC920]'].join(' ')}
          >
            <div className="relative z-10 flex items-center mb-4 sm:mb-0">
              <div
                className={[
                  'flex min-w-[20px] opacity-50',
                  isHackathonLive && 'opacity-pulse',
                ].join(' ')}
              >
                <svg
                  width="21"
                  height="21"
                  viewBox="0 0 21 21"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M5.55025 3.97258C5.94078 4.36311 5.94078 4.99627 5.55025 5.38679C2.81658 8.12046 2.81658 12.5526 5.55025 15.2863C5.94078 15.6768 5.94078 16.31 5.55025 16.7005C5.15973 17.091 4.52656 17.091 4.13604 16.7005C0.62132 13.1858 0.62132 7.4873 4.13604 3.97258C4.52656 3.58206 5.15973 3.58206 5.55025 3.97258ZM15.4498 3.97281C15.8403 3.58229 16.4735 3.58229 16.864 3.97281C20.3787 7.48753 20.3787 13.186 16.864 16.7007C16.4735 17.0913 15.8403 17.0913 15.4498 16.7007C15.0592 16.3102 15.0592 15.677 15.4498 15.2865C18.1834 12.5529 18.1834 8.1207 15.4498 5.38703C15.0592 4.9965 15.0592 4.36334 15.4498 3.97281ZM8.37869 6.80101C8.76921 7.19153 8.76921 7.8247 8.37869 8.21522C7.20711 9.38679 7.20711 11.2863 8.37869 12.4579C8.76921 12.8484 8.76921 13.4816 8.37868 13.8721C7.98816 14.2626 7.355 14.2626 6.96447 13.8721C5.01185 11.9195 5.01185 8.75363 6.96447 6.80101C7.355 6.41048 7.98816 6.41048 8.37869 6.80101ZM12.6213 6.80124C13.0119 6.41072 13.645 6.41072 14.0355 6.80124C15.9882 8.75386 15.9882 11.9197 14.0355 13.8723C13.645 14.2628 13.0119 14.2628 12.6213 13.8723C12.2308 13.4818 12.2308 12.8486 12.6213 12.4581C13.7929 11.2865 13.7929 9.38703 12.6213 8.21545C12.2308 7.82493 12.2308 7.19176 12.6213 6.80124ZM10.5 9.33677C11.0523 9.33677 11.5 9.78449 11.5 10.3368V10.3468C11.5 10.8991 11.0523 11.3468 10.5 11.3468C9.94772 11.3468 9.5 10.8991 9.5 10.3468V10.3368C9.5 9.78449 9.94772 9.33677 10.5 9.33677Z"
                    fill="#F2F2F2"
                  />
                </svg>
              </div>
              <div className="flex flex-col lg:flex-row ml-2 sm:ml-4">
                <span className="text-white mr-2">Supabase AI Hackathon</span>
              </div>
            </div>
            <div className="flex w-full sm:w-auto justify-center gap-2 z-10">
              <ChipLink href={'/blog/launch-week-7-hackathon'}>
                Blog post
                <div className="bg-[#313131] rounded-full hidden sm:inline-block p-1 ml-2">
                  <PencilSvg />
                </div>
              </ChipLink>
            </div>
            {isHackathonLive && (
              <div className="absolute opacity-pulse inset-0 w-full h-full bg-gradient-to-b from-[#1C1C1C80] to-[#1C1C1C] rounded-2xl overflow-hidden shadow-lg pointer-events-none" />
            )}
          </SmallCard>
          <SmallCard bgGradient>
            <div className="relative flex items-center mb-4 sm:mb-0">
              <div className="flex min-w-[20px]">
                <svg
                  width="21"
                  height="21"
                  viewBox="0 0 21 21"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M5.91406 2.17188C6.46635 2.17188 6.91406 2.61959 6.91406 3.17188V4.17188H7.91406C8.46635 4.17188 8.91406 4.61959 8.91406 5.17188C8.91406 5.72416 8.46635 6.17188 7.91406 6.17188H6.91406V7.17188C6.91406 7.72416 6.46635 8.17188 5.91406 8.17188C5.36178 8.17188 4.91406 7.72416 4.91406 7.17188V6.17188H3.91406C3.36178 6.17188 2.91406 5.72416 2.91406 5.17188C2.91406 4.61959 3.36178 4.17188 3.91406 4.17188H4.91406V3.17188C4.91406 2.61959 5.36178 2.17188 5.91406 2.17188ZM5.91406 12.1719C6.46635 12.1719 6.91406 12.6196 6.91406 13.1719V14.1719H7.91406C8.46635 14.1719 8.91406 14.6196 8.91406 15.1719C8.91406 15.7242 8.46635 16.1719 7.91406 16.1719H6.91406V17.1719C6.91406 17.7242 6.46635 18.1719 5.91406 18.1719C5.36178 18.1719 4.91406 17.7242 4.91406 17.1719V16.1719H3.91406C3.36178 16.1719 2.91406 15.7242 2.91406 15.1719C2.91406 14.6196 3.36178 14.1719 3.91406 14.1719H4.91406V13.1719C4.91406 12.6196 5.36178 12.1719 5.91406 12.1719Z"
                    fill="#F2F2F2"
                  />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12.914 2.17188C13.3677 2.17188 13.7646 2.47736 13.8807 2.91598L15.0599 7.37081L18.4137 9.30569C18.7233 9.48428 18.914 9.8145 18.914 10.1719C18.914 10.5293 18.7233 10.8595 18.4137 11.0381L15.0599 12.9729L13.8807 17.4278C13.7646 17.8664 13.3677 18.1719 12.914 18.1719C12.4603 18.1719 12.0634 17.8664 11.9473 17.4278L10.7681 12.9729L7.41433 11.0381C7.10478 10.8595 6.91406 10.5293 6.91406 10.1719C6.91406 9.8145 7.10478 9.48428 7.41433 9.30569L10.7681 7.37081L11.9473 2.91598C12.0634 2.47736 12.4603 2.17188 12.914 2.17188Z"
                    fill="#F2F2F2"
                  />
                </svg>
              </div>
              <div className="flex flex-col lg:flex-row ml-2 sm:ml-4">
                <span className="text-white mr-2">Join the prize draw</span>
              </div>
            </div>
            <div className="flex w-full sm:w-auto justify-center gap-2 z-10">
              <ChipLink href="#lw-7-prizes" className="!pr-3 !justify-center">
                More info
              </ChipLink>
            </div>
          </SmallCard>
        </div>
      </SectionContainer>
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
          <div className="border-b border-[#232323] pb-3">
            <Accordion.Item
              header={
                <AccordionHeader
                  date={preRelease.date}
                  day={preRelease.dd}
                  title={preRelease.title}
                  shipped={prereleaseShipped}
                />
              }
              key={preRelease.dd}
              disabled={!prereleaseShipped}
              className="h-[79px]"
              id={preRelease.d.toString()}
            >
              {preRelease.steps.length > 0 && (
                <div className="h-[800px] lg:h-[400px] flex flex-col gap-5 lg:flex-row">
                  <motion.div
                    className={`
                      relative overflow-hidden group/2 flex-1 flex flex-col items-center gap-5 lg:items-start justify-between
                      basis-1/2 lg:flex-shrink xl:basis-2/3 border border-[#232323] rounded-xl h-full py-10 sm:py-14 px-8 lg:px-10 xs:text-2xl text-xl text-center shadow-lg
                    `}
                    initial="default"
                    animate="default"
                    whileHover="hover"
                  >
                    <div
                      className="inset-0 absolute group-hover/2:scale-105 opacity-60 group-hover/2:opacity-100 w-full h-full -z-10 transition-all duration-500"
                      style={{
                        background: `radial-gradient(90% 130px at 80% 0px, #4635A7, transparent)`,
                      }}
                    />
                    <div className="flex items-center text-center lg:text-left justify-between flex-col-reverse lg:flex-row lg:justify-start gap-2 text-white">
                      <CartTitle>{preRelease.steps[0].title}</CartTitle>
                      <StyledArticleBadge className="lg:ml-2">Guide</StyledArticleBadge>
                    </div>
                    <SectionButtons
                      docs={preRelease.steps[0].docs}
                      blog={preRelease.steps[0].blog}
                    />
                    {preRelease.steps[0].bg_layers &&
                      preRelease.steps[0].bg_layers?.map(
                        (layer, i) =>
                          !!layer.img && (
                            <motion.div
                              className="absolute opacity-90 inset-0 w-full h-full -z-10"
                              variants={
                                i === 2 && isTablet
                                  ? aiImageMobileVariant
                                  : i !== 0
                                    ? opacityVariant
                                    : undefined
                              }
                            >
                              <Image
                                src={i === 2 && isTablet ? (layer.mobileImg as any) : layer.img}
                                className={`
                                  absolute opacity-90
                                  w-full h-full -z-10 transition-all duration-300
                                `}
                                layout="fill"
                                objectPosition={i === 2 && isTablet ? '50% 60%' : '80% 50%'}
                                objectFit={i === 2 && isTablet ? 'contain' : 'cover'}
                                alt=""
                              />
                            </motion.div>
                          )
                      )}
                  </motion.div>
                  <motion.div
                    className={`
                      relative overflow-hidden group/3 flex-1 flex flex-col items-center justify-between
                      basis-1/2 lg:basis-1/3 border border-[#232323] rounded-xl h-full bg-no-repeat py-10 sm:py-14 px-8 lg:px-10 text-2xl bg-contain shadow-lg
                      `}
                    initial="default"
                    animate="default"
                    whileHover="hover"
                  >
                    <div
                      className="top-0 absolute group-hover/3:scale-105 opacity-60 group-hover/3:opacity-100 w-full h-full -z-10 transition-all duration-500"
                      style={{
                        background: `radial-gradient(90% 40% at 50% -10%, #4635A7, transparent)`,
                      }}
                    />
                    <div className="flex flex-col items-center gap-2 min-w-[300px]">
                      <StyledArticleBadge>New</StyledArticleBadge>
                      <CartTitle>{preRelease.steps[1].title}</CartTitle>
                      <p className="text-sm text-slate-900">{preRelease.steps[1].description}</p>
                    </div>
                    <SectionButtons
                      github={preRelease.steps[1].github}
                      hackernews={preRelease.steps[1].hackernews}
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
                                alt=""
                              />
                            </motion.div>
                          )
                      )}
                  </motion.div>
                </div>
              )}
            </Accordion.Item>
          </div>
          <div className="border-b border-[#232323] pb-3">
            <Accordion.Item
              header={
                <AccordionHeader
                  date={day1.date}
                  day={day1.dd}
                  title={day1.title}
                  shipped={day1Shipped}
                />
              }
              disabled={!day1Shipped}
              className="h-[79px]"
              id={day1.d.toString()}
            >
              {day1.steps.length > 0 && (
                <div className="h-[400px] flex flex-col gap-5 lg:flex-row">
                  <motion.div
                    className={`
                      relative overflow-hidden group/2 flex-1 flex flex-col items-center gap-5 lg:items-start justify-between
                      w-full border border-[#232323] rounded-xl h-full px-4 sm:px-8 lg:px-14 py-14 xs:text-2xl text-xl text-center shadow-lg
                    `}
                    initial="default"
                    animate="default"
                    whileHover="hover"
                  >
                    <div className="flex items-center text-center lg:text-left justify-between flex-col-reverse lg:flex-row lg:justify-start gap-2 text-white">
                      <CartTitle>{day1.steps[0].title}</CartTitle>
                      <StyledArticleBadge className="lg:ml-2">New</StyledArticleBadge>
                    </div>
                    <SectionButtons
                      blog={day1.steps[0].blog}
                      video={day1.steps[0].video}
                      hackernews={day1.steps[0].hackernews}
                    />
                    {day1.steps[0].bg_layers &&
                      day1.steps[0].bg_layers?.map(
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
                                alt=""
                              />
                            </motion.div>
                          )
                      )}
                  </motion.div>
                </div>
              )}
            </Accordion.Item>
          </div>
          <div className="border-b border-[#232323] pb-3">
            <Accordion.Item
              header={
                <AccordionHeader
                  date={day2.date}
                  day={day2.dd}
                  title={day2.title}
                  shipped={day2Shipped}
                />
              }
              disabled={!day2Shipped}
              className="h-[79px]"
              id={day2.d.toString()}
            >
              {day2.steps.length > 0 && (
                <div className="h-[400px] flex flex-col gap-5 lg:flex-row">
                  <motion.div
                    className={`
                      relative overflow-hidden group/2 flex-1 flex flex-col items-center gap-5 lg:items-start justify-between
                      w-full border rounded-xl h-full px-4 sm:px-8 lg:px-14 py-14 xs:text-2xl text-xl text-center shadow-lg
                    `}
                    initial="default"
                    animate="default"
                    whileHover="hover"
                  >
                    <div className="flex items-center text-center lg:text-left justify-between flex-col-reverse lg:flex-row lg:justify-start gap-2 text-foreground">
                      <CartTitle>{day2.steps[0].title}</CartTitle>
                      <StyledArticleBadge className="lg:ml-2">New</StyledArticleBadge>
                    </div>
                    <SectionButtons
                      blog={day2.steps[0].blog}
                      video={day2.steps[0].video}
                      hackernews={day2.steps[0].hackernews}
                    />
                    {day2.steps[0].bg_layers &&
                      day2.steps[0].bg_layers?.map(
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
                                alt=""
                              />
                            </motion.div>
                          )
                      )}
                  </motion.div>
                </div>
              )}
            </Accordion.Item>
          </div>
          <div className="border-b border-[#232323] pb-3">
            <Accordion.Item
              header={
                <AccordionHeader
                  date={day3.date}
                  day={day3.dd}
                  title={day3.title}
                  shipped={day3Shipped}
                />
              }
              disabled={!day3Shipped}
              className="h-[79px]"
              id={day3.d.toString()}
            >
              {day3.steps.length > 0 && (
                <div className="h-[400px] flex flex-col gap-5 lg:flex-row">
                  <motion.div
                    className={`
                      relative overflow-hidden group/2 flex-1 flex flex-col items-center gap-5 lg:items-start justify-between
                      w-full border rounded-xl h-full px-4 sm:px-8 lg:px-14 py-14 xs:text-2xl text-xl text-center shadow-lg
                    `}
                    initial="default"
                    animate="default"
                    whileHover="hover"
                  >
                    <div className="flex items-center text-center lg:text-left justify-between flex-col-reverse lg:flex-row lg:justify-start gap-2 text-foreground">
                      <CartTitle>{day3.steps[0].title}</CartTitle>
                      <StyledArticleBadge className="lg:ml-2">Updated</StyledArticleBadge>
                    </div>
                    <SectionButtons
                      docs={day3.steps[0].docs}
                      blog={day3.steps[0].blog}
                      video={day3.steps[0].video}
                    />
                    {day3.steps[0].bg_layers &&
                      day3.steps[0].bg_layers?.map(
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
                                alt=""
                              />
                            </motion.div>
                          )
                      )}
                  </motion.div>
                </div>
              )}
            </Accordion.Item>
          </div>
          <div className="border-b border-[#232323] pb-3">
            <Accordion.Item
              header={
                <AccordionHeader
                  date={day4.date}
                  day={day4.dd}
                  title={day4.title}
                  shipped={day4Shipped}
                />
              }
              disabled={!day4Shipped}
              className="h-[79px]"
              id={day4.d.toString()}
            >
              {day4.steps.length > 0 && (
                <div className="h-[400px] flex flex-col gap-5 lg:flex-row">
                  <motion.div
                    className={`
                      relative overflow-hidden group/2 flex-1 flex flex-col items-center gap-5 lg:items-start justify-between
                      w-full border rounded-xl h-full px-4 sm:px-8 lg:px-14 py-14 xs:text-2xl text-xl text-center shadow-lg
                    `}
                    initial="default"
                    animate="default"
                    whileHover="hover"
                  >
                    <div className="flex items-center text-center lg:text-left justify-between flex-col-reverse lg:flex-row lg:justify-start gap-2 text-foreground">
                      <CartTitle>{day4.steps[0].title}</CartTitle>
                      <StyledArticleBadge className="lg:ml-2">New</StyledArticleBadge>
                    </div>
                    <SectionButtons
                      docs={day4.steps[0].docs}
                      blog={day4.steps[0].blog}
                      video={day4.steps[0].video}
                      hackernews={day4.steps[0].hackernews}
                      mobileGrid
                    />
                    {day4.steps[0].bg_layers &&
                      day4.steps[0].bg_layers?.map(
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
                                alt=""
                              />
                            </motion.div>
                          )
                      )}
                  </motion.div>
                </div>
              )}
            </Accordion.Item>
          </div>
          <div className="border-b border-[#232323] pb-3" id="currentDay">
            <Accordion.Item
              header={
                <AccordionHeader
                  date={day5.date}
                  day={day5.dd}
                  title={day5.title}
                  shipped={day5Shipped}
                />
              }
              disabled={!day5Shipped}
              className="h-[79px]"
              id={day5.d.toString()}
            >
              <Day5 day={day5} />
            </Accordion.Item>
          </div>
        </Accordion>
      </SectionContainer>
    </>
  )
}
