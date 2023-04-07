import Image from 'next/image'
import { useEffect } from 'react'
import { Accordion, IconArrowDown } from 'ui'
import Lottie from 'lottie-react'

import days, { WeekDayProps, endOfLW7 } from '~/components/LaunchWeek/lw7_days'
import SectionContainer from '~/components/Layouts/SectionContainer'
import {
  AccordionHeader,
  CartTitle,
  ChipLink,
  PencilSvg,
  PlaySvg,
  SectionButtons,
  SmallCard,
  StyledArticleBadge,
} from './components'

import styles from './styles/launchWeek7.module.css'
import { useMobileViewport } from '../../../../hooks/useMobileViewport'
import { motion } from 'framer-motion'

const defaultEase = [0.25, 0.25, 0, 1]

const opacityVariant = {
  default: { opacity: 0.9, ease: defaultEase, duration: 0.2 },
  hover: {
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: defaultEase,
    },
  },
}
const scaleOpacityVariant = {
  default: { scale: 1, opacity: 0.9, ease: defaultEase, duration: 0.2 },
  hover: {
    scale: 1.05,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: defaultEase,
    },
  },
}
const aiImageMobileVariant = {
  default: { scale: 0.9 },
  hover: {
    scale: 0.9,
  },
}

export default function LW7Releases() {
  const [preRelease, day1, day2, day3, day4, day5] = days
  const isMobile = useMobileViewport(767)
  const isTablet = useMobileViewport(1023)
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
      {isHackathonLive && (
        <div className="mb-4">
          <a href="#lw-7-prizes" className="flex items-center text-white text-sm my-4 gap-4">
            Join Hackathon{' '}
            <span className="bounce-loop">
              <IconArrowDown w={10} h={12} />
            </span>
          </a>
        </div>
      )}
      <SectionContainer className="!py-0">
        <div className="grid grid-cols-1 gap-4">
          <SmallCard
            bgGradient
            className={[isHackathonLive && '!from-[#4635A7] !to-[#A69DC920]'].join(' ')}
          >
            <div className="relative flex items-center mb-4 sm:mb-0">
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
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M5.55025 3.97258C5.94078 4.36311 5.94078 4.99627 5.55025 5.38679C2.81658 8.12046 2.81658 12.5526 5.55025 15.2863C5.94078 15.6768 5.94078 16.31 5.55025 16.7005C5.15973 17.091 4.52656 17.091 4.13604 16.7005C0.62132 13.1858 0.62132 7.4873 4.13604 3.97258C4.52656 3.58206 5.15973 3.58206 5.55025 3.97258ZM15.4498 3.97281C15.8403 3.58229 16.4735 3.58229 16.864 3.97281C20.3787 7.48753 20.3787 13.186 16.864 16.7007C16.4735 17.0913 15.8403 17.0913 15.4498 16.7007C15.0592 16.3102 15.0592 15.677 15.4498 15.2865C18.1834 12.5529 18.1834 8.1207 15.4498 5.38703C15.0592 4.9965 15.0592 4.36334 15.4498 3.97281ZM8.37869 6.80101C8.76921 7.19153 8.76921 7.8247 8.37869 8.21522C7.20711 9.38679 7.20711 11.2863 8.37869 12.4579C8.76921 12.8484 8.76921 13.4816 8.37868 13.8721C7.98816 14.2626 7.355 14.2626 6.96447 13.8721C5.01185 11.9195 5.01185 8.75363 6.96447 6.80101C7.355 6.41048 7.98816 6.41048 8.37869 6.80101ZM12.6213 6.80124C13.0119 6.41072 13.645 6.41072 14.0355 6.80124C15.9882 8.75386 15.9882 11.9197 14.0355 13.8723C13.645 14.2628 13.0119 14.2628 12.6213 13.8723C12.2308 13.4818 12.2308 12.8486 12.6213 12.4581C13.7929 11.2865 13.7929 9.38703 12.6213 8.21545C12.2308 7.82493 12.2308 7.19176 12.6213 6.80124ZM10.5 9.33677C11.0523 9.33677 11.5 9.78449 11.5 10.3368V10.3468C11.5 10.8991 11.0523 11.3468 10.5 11.3468C9.94772 11.3468 9.5 10.8991 9.5 10.3468V10.3368C9.5 9.78449 9.94772 9.33677 10.5 9.33677Z"
                    fill="#F2F2F2"
                  />
                </svg>
              </div>
              <div className="flex flex-col lg:flex-row ml-2 sm:ml-4">
                <span className="text-black dark:text-white mr-2">Supa AI Hackathon</span>
              </div>
            </div>
            <div className="flex gap-2 z-10">
              <ChipLink href={'/blog/launch-week-7-hackathon'}>
                Blog post
                <div className="bg-[#eeeeee] dark:bg-[#313131] rounded-full inline-block p-1 ml-2">
                  <PencilSvg />
                </div>
              </ChipLink>
            </div>
          </SmallCard>
        </div>
      </SectionContainer>
      <SectionContainer className="!pt-0">
        <Accordion
          type="default"
          openBehaviour="multiple"
          size="large"
          className="text-scale-900 dark:text-white"
          justified={false}
          // bordered={false}
          chevronAlign="right"
          defaultValue={publishedSections}
        >
          <div className="border-b pb-3">
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
                      basis-1/2 lg:basis-2/3 border rounded-xl h-full p-14 xs:text-2xl text-xl text-center
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
                    <div className="flex items-center text-center lg:text-left lg: justify-between flex-col-reverse lg:flex-row lg:justify-start gap-2 text-black dark:text-white">
                      <div>{preRelease.steps[0].title}</div>
                      <StyledArticleBadge className="lg:ml-4">Guide</StyledArticleBadge>
                    </div>
                    <SectionButtons
                      docs={preRelease.steps[0].docs}
                      blog={preRelease.steps[0].blog}
                    />
                    {preRelease.steps[0].bg_layers &&
                      preRelease.steps[0].bg_layers?.map((layer, i) =>
                        !!layer.lottie ? (
                          <div className="absolute inset-0 opacity-90 w-full h-full -z-10 transition-all duration-300">
                            <Lottie
                              style={{
                                position: 'absolute',
                                inset: 0,
                                width: '100%',
                                height: '100%',
                              }}
                              autoplay={true}
                              animationData={layer.lottie}
                            />
                          </div>
                        ) : (
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
                              />
                            </motion.div>
                          )
                        )
                      )}
                  </motion.div>
                  <motion.div
                    className={`
                      relative overflow-hidden group/3 flex-1 flex flex-col items-center justify-between
                      basis-1/2 lg:basis-1/3 border rounded-xl h-full bg-no-repeat py-14 lg:px-10 text-2xl bg-contain
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
                      preRelease.steps[1].bg_layers?.map((layer, i) =>
                        !!layer.lottie ? (
                          <div className="absolute inset-0 opacity-90 w-full h-full -z-10 transition-all duration-300">
                            <Lottie loop={true} autoplay={true} animationData={layer.lottie} />
                          </div>
                        ) : (
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
                        )
                      )}
                  </motion.div>
                </div>
              )}
            </Accordion.Item>
          </div>
          <div className="border-b pb-3">
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
              <div></div>
            </Accordion.Item>
          </div>
          <div className="border-b pb-3">
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
              <div></div>
            </Accordion.Item>
          </div>
          <div className="border-b pb-3">
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
              <div></div>
            </Accordion.Item>
          </div>
          <div className="border-b pb-3">
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
              <div></div>
            </Accordion.Item>
          </div>
          <div className="border-b pb-3" id="currentDay">
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
              <div></div>
            </Accordion.Item>
          </div>
        </Accordion>
      </SectionContainer>
    </>
  )
}
