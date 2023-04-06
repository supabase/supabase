import Image from 'next/image'
import { useEffect } from 'react'
import { Accordion } from 'ui'

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

export default function LW7Releases() {
  const [preRelease, day1, day2, day3, day4, day5] = days

  const publishedSections =
    days
      .filter((day: WeekDayProps) => Date.parse(day.publishedAt) <= Date.now())
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
      <SectionContainer className="!py-0 ">
        <div className="grid grid-cols-1 gap-4">
          <SmallCard
            bgGradient
            className={[isHackathonLive && 'from-[#4635A7] to-[#A69DC920]'].join(' ')}
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
                  <div
                    className={`relative overflow-hidden group/2 flex-1 flex flex-col items-center gap-5 lg:items-start justify-between basis-1/2 lg:basis-2/3 border rounded-xl h-full p-14 xs:text-2xl text-xl text-center bg-no-repeat bg-[url('/images/launchweek/seven/day0/ai_images.png')] xs:bg-[url('/images/launchweek/seven/day0/ai_images.png')] dark:bg-[url('/images/launchweek/seven/day0/ai_images.png')] xs:dark:bg-[url('/images/launchweek/seven/day0/ai_images.png')] bg-[right_0px_top_0px] lg:bg-[top_0px_bottom_0px_right_0px] bg-cover`}
                  >
                    <div
                      className="top-0 absolute group-hover/2:scale-105 opacity-60 group-hover/2:opacity-100 w-full h-full -z-10 transition-all duration-500"
                      style={{
                        background: `radial-gradient(90% 130px at 80% 0px, #4635A7, transparent)`,
                      }}
                    />
                    <div className="flex items-center lg: justify-between flex-col-reverse lg:flex-row lg:justify-start gap-2 text-black dark:text-white">
                      <div>{preRelease.steps[0].title}</div>
                      <StyledArticleBadge className="lg:ml-4">Guide</StyledArticleBadge>
                    </div>
                    <SectionButtons
                      docs={preRelease.steps[0].docs}
                      blog={preRelease.steps[0].blog}
                    />
                  </div>
                  <div
                    className={`
                      relative overflow-hidden group/3 flex-1 flex flex-col items-center justify-between
                      basis-1/2 lg:basis-1/3 border rounded-xl h-full bg-no-repeat py-14 lg:px-10 text-2xl bg-contain
                      `}
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
                  </div>
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
              {day1.steps.length > 0 && (
                <div className="h-[400px] flex flex-col lg:flex-row group/day1 relative overflow-hidden">
                  <div
                    className="absolute group-hover/day1:scale-105 opacity-60 group-hover/day1:opacity-100 w-full h-full -z-10 transition-all duration-500"
                    style={{
                      background: `radial-gradient(650px 150px at 50% 100%, #4635A7, transparent)`,
                    }}
                  ></div>
                  <div
                    className={`flex flex-col flex-1 items-center gap-5 lg:items-start lg:justify-between border rounded-xl h-full relative overflow-hidden after:opacity- after:absolute after:bg-no-repeat after:bg-[center_bottom] lg:after:bg-[right_15%_top_100px] xl:after:bg-[right_15%_top_60px] after:bg-[length:300px_180px] after:lg:bg-[length:450px_300px] after:xl:bg-[length:528px_367px] after:dark:bg-[url('/images/launchweek/docs-update-bg.png')] after:bg-[url('/images/launchweek/docs-update-bg-light.png')] after:top-0 after:right-0 after:bottom-0 after:left-0 p-14 text-2xl before:absolute before:w-full before:h-full before:top-52 before:right-0 before:bottom-0 before:left-0 before:border-[#1f3536] before:-z-10 !px-3 sm:!px-14`}
                  >
                    <div className="flex items-center relative z-10 justify-between flex-col-reverse lg:flex-row lg:justify-start gap-2 text-black dark:text-white">
                      <span>{day1.description}</span>
                      <StyledArticleBadge className="lg:ml-4">Redesigned</StyledArticleBadge>
                    </div>
                    <SectionButtons
                      docs={day1.steps[0].docs}
                      blog={day1.steps[0].blog}
                      video={'https://www.youtube.com/watch?v=Q1Amk6iDlF8&ab_channel=Supabase'}
                    />
                  </div>
                </div>
              )}
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
              {day2.steps.length > 0 && (
                <div className="h-[800px] lg:h-[400px] flex flex-col gap-5 lg:flex-row">
                  <div
                    className={`relative overflow-hidden group/2 flex-1 flex flex-col items-center gap-5 lg:items-start justify-between basis-1/2 lg:basis-2/3 border rounded-xl h-full p-14 xs:text-2xl text-xl text-center bg-no-repeat bg-[url('/images/launchweek/image-processing-bg-light-alt.png')] xs:bg-[url('/images/launchweek/image-processing-bg-light.png')] dark:bg-[url('/images/launchweek/image-processing-bg-alt.png')] xs:dark:bg-[url('/images/launchweek/image-processing-bg.png')] bg-[right_30px_top_35px] lg:bg-[top_25px_right_25px] bg-contain`}
                  >
                    <div
                      className="top-0 absolute group-hover/2:scale-105 opacity-60 group-hover/2:opacity-100 w-full h-full -z-10 transition-all duration-500"
                      style={{
                        background: `radial-gradient(90% 130px at 80% 0px, #4635A7, transparent)`,
                      }}
                    ></div>
                    <div className="flex items-center lg: justify-between flex-col-reverse lg:flex-row lg:justify-start gap-2 text-black dark:text-white">
                      <div>{day2.steps[0].title}</div>
                      <StyledArticleBadge>New</StyledArticleBadge>
                    </div>
                    <SectionButtons docs={day2.steps[0].docs} blog={day2.steps[0].blog} />
                  </div>
                  <div
                    className={`relative overflow-hidden group/3 flex-1 flex flex-col items-center justify-between basis-1/2 lg:basis-1/3 border rounded-xl h-full bg-no-repeat p-14 text-2xl bg-[url('/images/launchweek/cdn-caching-bg-light.png')] dark:bg-[url('/images/launchweek/cdn-caching-bg.png')] bg-[top_170px_center] lg:bg-[center_bottom] bg-contain`}
                  >
                    <div
                      className="top-0 absolute group-hover/3:scale-105 opacity-60 group-hover/3:opacity-100 w-full h-full -z-10 transition-all duration-500"
                      style={{
                        background: `radial-gradient(90% 130px at 50% 0px, #4635A7, transparent)`,
                      }}
                    ></div>
                    <div className="flex flex-col items-center gap-2 min-w-[300px]">
                      <StyledArticleBadge className="lg:ml-4">New</StyledArticleBadge>
                      <span className="text-black dark:text-white">{day2.steps[1].title}</span>
                      <p className="text-sm text-slate-900">{day2.steps[1].description}</p>
                    </div>
                    <SectionButtons docs={day2.steps[1].docs} blog={day2.steps[1].blog} />
                  </div>
                </div>
              )}
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
              {day3.steps.length > 0 && (
                <div className="h-[400px] flex gap-5 group">
                  <div
                    className={`flex flex-col text-center items-center lg:items-start justify-between flex-1 border rounded-xl h-full bg-no-repeat p-14 text-2xl relative`}
                  >
                    <div className="absolute top-0 right-0 w-full h-full -z-20 ">
                      <Image
                        src={'/images/launchweek/mfa-dark.png'}
                        layout="fill"
                        objectFit="cover"
                        quality={100}
                        priority
                      />
                    </div>
                    <div className="absolute top-0 right-0 w-full h-full -z-10 opacity-0 group-hover:opacity-100 duration-500 transition-all">
                      <Image
                        src={'/images/launchweek/mfa-dark-hover.png'}
                        layout="fill"
                        objectFit="cover"
                        quality={100}
                      />
                    </div>

                    <div className="flex items-center justify-between flex-col-reverse lg:flex-row lg:justify-start text-black dark:text-white">
                      <span>{day3.steps[0].title}</span>
                      <StyledArticleBadge className="lg:ml-4">Updated</StyledArticleBadge>
                    </div>
                    <SectionButtons docs={day3.steps[0].docs} blog={day3.steps[0].blog} />
                  </div>
                </div>
              )}
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
              {day4.steps.length > 0 && (
                <div className="h-[400px]  flex flex-col gap-5 lg:flex-row group/day4 relative overflow-hidden">
                  <div
                    className={`relative flex flex-col items-center justify-between lg:items-start flex-1 basis-1/2 lg:basis-2/3 border rounded-xl h-full p-14 text-2xl bg-no-repeat bg-cover !px-3 sm:!px-14`}
                  >
                    <div
                      className={`absolute top-0 right-0 w-full h-full -z-20 ${styles.wrappers}`}
                    >
                      <Image
                        src={'/images/launchweek/wrappers-visual.svg'}
                        layout="fill"
                        objectFit="cover"
                        quality={100}
                        priority
                        className="left-16"
                      />
                    </div>
                    <div
                      className={`absolute top-0 right-0 w-full h-full -z-10 opacity-0 group-hover/day4:opacity-100 duration-500 transition-all ${styles.wrappers}`}
                    >
                      <Image
                        src={'/images/launchweek/wrappers-visual-hover.svg'}
                        layout="fill"
                        objectFit="cover"
                        quality={100}
                        className="test"
                      />
                    </div>
                    <div className="flex items-center flex-col-reverse lg:flex-row text-black dark:text-white">
                      <span>{day4.steps[0].title}</span>
                      <StyledArticleBadge className="lg:ml-4">New</StyledArticleBadge>
                    </div>
                    <SectionButtons
                      docs={day4.steps[0].docs}
                      blog={day4.steps[0].blog}
                      video={`https://www.youtube.com/watch?v=${day4.youtube_id}&ab_channel=Supabase`}
                    />
                  </div>
                </div>
              )}
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
              {day5.steps.length > 0 && (
                <>
                  <div className="h-[800px] lg:h-[400px]  flex flex-col gap-5 lg:flex-row">
                    <div
                      className={`relative group/day5step1 flex flex-col items-center justify-between lg:items-start flex-1 basis-1/2 lg:basis-2/3 border rounded-xl h-full bg-no-repeat p-14 text-2xl overflow-hidden`}
                    >
                      <div
                        className={`absolute top-0 right-0 w-full h-full -z-20 ${styles.wrappers}`}
                      >
                        <Image
                          src={'/images/launchweek/vault-visual.svg'}
                          layout="fill"
                          objectFit="cover"
                          quality={100}
                          priority
                          className="left-16"
                        />
                      </div>
                      <div
                        className={`absolute top-0 right-0 w-full h-full -z-10 opacity-0 group-hover/day5step1:opacity-100 duration-500 transition-all ${styles.wrappers}`}
                      >
                        <Image
                          src={'/images/launchweek/vault-visual-hover.svg'}
                          layout="fill"
                          objectFit="cover"
                          quality={100}
                          className="test"
                        />
                      </div>
                      <div className="flex items-center flex-col-reverse lg:flex-row">
                        <span className="text-black dark:text-white">{day5.steps[0].title}</span>
                        <StyledArticleBadge className="lg:ml-4">New</StyledArticleBadge>
                      </div>
                      <SectionButtons docs={day5.steps[0].docs} blog={day5.steps[0].blog} />
                    </div>
                    <div
                      className={`relative group/day5step2 flex-1 flex flex-col items-center justify-between basis-1/2 lg:basis-1/3 border rounded-xl h-full bg-no-repeat p-14 text-2xl overflow-hidden`}
                    >
                      <div className={`absolute top-0 right-0 w-full h-full -z-20`}>
                        <Image
                          src={'/images/launchweek/TCE-visual.svg'}
                          layout="fill"
                          objectFit="cover"
                          quality={100}
                          priority
                          className="left-16"
                        />
                      </div>
                      <div
                        className={`absolute top-0 right-0 w-full h-full -z-10 opacity-0 group-hover/day5step2:opacity-100 duration-500 transition-all`}
                      >
                        <Image
                          src={'/images/launchweek/TCE-visual-hover.svg'}
                          layout="fill"
                          objectFit="cover"
                          quality={100}
                          className="test"
                        />
                      </div>
                      <div className="flex flex-col items-center gap-2 min-w-[300px]">
                        <StyledArticleBadge>New</StyledArticleBadge>
                        <span className="text-black dark:text-white text-center">
                          {day5.steps[1].title}
                        </span>
                      </div>
                      <SectionButtons docs={day5.steps[1].docs} blog={day5.steps[1].blog} />
                    </div>
                  </div>
                  <h3 className="text-black dark:text-white text-lg mb-4 mt-4">Community</h3>
                  <div className="h-[400px] flex flex-col gap-5 lg:flex-row group/community relative overflow-hidden">
                    <div
                      className={`relative flex flex-col items-center justify-between lg:items-start flex-1 basis-1/2 lg:basis-2/3 border rounded-xl h-full p-14 text-2xl bg-no-repeat bg-cover !px-3 sm:!px-14`}
                    >
                      <div
                        className={`absolute top-0 right-0 w-full h-full -z-20 ${styles.community_wrappers}`}
                      >
                        <Image
                          src={'/images/launchweek/community-visual.svg'}
                          layout="fill"
                          objectFit="cover"
                          quality={100}
                          priority
                          className="left-16"
                        />
                      </div>
                      <div
                        className={`absolute top-0 right-0 w-full h-full -z-10 opacity-0 group-hover/community:opacity-100 duration-500 transition-all ${styles.community_wrappers}`}
                      >
                        <Image
                          src={'/images/launchweek/community-visual-hover.svg'}
                          layout="fill"
                          objectFit="cover"
                          quality={100}
                          className="test"
                        />
                      </div>
                      <div className="flex items-center flex-col-reverse lg:flex-row">
                        <span className="text-black dark:text-white">Community Day</span>
                      </div>
                      <div className="flex flex-col md:flex-row gap-4 md:gap-2 z-10 ">
                        <div className="flex gap-4 md:gap-2">
                          <a
                            href={'/blog/launch-week-6-community-day'}
                            target="_blank"
                            rel="noopener"
                          >
                            <div className="flex items-center border border-slate-400 bg-gradient-to-r from-[#fcfcfc] to-[#f2f2f2] hover:to-[#d5d5d5] text-black dark:text-white dark:from-[#191919] dark:to-[#464444] dark:hover:to-[#4e4e4e] rounded-full text-sm py-2 pl-3 pr-2">
                              Blog post
                              <div className="bg-[#eeeeee] dark:bg-[#313131] rounded-full inline-block p-1 ml-2">
                                <PencilSvg />
                              </div>
                            </div>
                          </a>
                          <a
                            href={'https://www.youtube.com/watch?v=hw9Q-NjASbU'}
                            target="_blank"
                            rel="noopener"
                          >
                            <div className="flex items-center border border-slate-400 bg-gradient-to-r from-[#fcfcfc] to-[#f2f2f2] hover:to-[#d5d5d5] text-black dark:text-white dark:from-[#191919] dark:to-[#464444] dark:hover:to-[#4e4e4e] rounded-full text-sm py-2 pl-3 pr-2">
                              Flutterflow
                              <div className="bg-[#eeeeee] dark:bg-[#313131] rounded-full inline-block p-1 ml-2">
                                <PlaySvg />
                              </div>
                            </div>
                          </a>
                        </div>
                        <div className="flex gap-4 md:gap-2">
                          <a
                            href={'https://www.youtube.com/watch?v=mw0DLwItue4'}
                            target="_blank"
                            rel="noopener"
                          >
                            <div className="flex items-center border border-slate-400 bg-gradient-to-r from-[#fcfcfc] to-[#f2f2f2] hover:to-[#d5d5d5] text-black dark:text-white dark:from-[#191919] dark:to-[#464444] dark:hover:to-[#4e4e4e] rounded-full text-sm py-2 pl-3 pr-2">
                              OneSignal
                              <div className="bg-[#eeeeee] dark:bg-[#313131] rounded-full inline-block p-1 ml-2">
                                <PlaySvg />
                              </div>
                            </div>
                          </a>
                          <a
                            href={'https://www.youtube.com/watch?v=EdYQ9fF-hz4'}
                            target="_blank"
                            rel="noopener"
                          >
                            <div className="flex items-center border border-slate-400 bg-gradient-to-r from-[#fcfcfc] to-[#f2f2f2] hover:to-[#d5d5d5] text-black dark:text-white dark:from-[#191919] dark:to-[#464444] dark:hover:to-[#4e4e4e] rounded-full text-sm py-2 pl-3 pr-2">
                              NextAuth
                              <div className="bg-[#eeeeee] dark:bg-[#313131] rounded-full inline-block p-1 ml-2">
                                <PlaySvg />
                              </div>
                            </div>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-black dark:text-white text-lg mb-4 mt-4">One more thing</h3>
                  <div className="flex flex-col lg:grid grid-cols-3 grid-rows-2 gap-4">
                    <div
                      className={`min-h-[400px] relative group/day5step2 flex-1 flex flex-col items-center justify-between basis-1/2 lg:basis-1/3 border rounded-xl bg-no-repeat p-14 text-2xl overflow-hidden`}
                    >
                      <div className={`absolute top-0 right-0 w-full h-full -z-20`}>
                        <Image
                          src={'/images/launchweek/PgGraphql-visual.svg'}
                          layout="fill"
                          objectFit="cover"
                          quality={100}
                          priority
                          className="left-16"
                        />
                      </div>
                      <div
                        className={`absolute top-0 right-0 w-full h-full -z-10 opacity-0 group-hover/day5step2:opacity-100 duration-500 transition-all`}
                      >
                        <Image
                          src={'/images/launchweek/PgGraphql-visual-hover.svg'}
                          layout="fill"
                          objectFit="cover"
                          quality={100}
                          className="test"
                        />
                      </div>
                      <div className="flex flex-col items-center gap-2 min-w-[300px]">
                        <StyledArticleBadge>Updated</StyledArticleBadge>
                        <span className="text-black dark:text-white text-center">
                          pg_graphql v1.0
                        </span>
                      </div>
                      <SectionButtons
                        docs="/docs/guides/api#graphql-api"
                        blog="/blog/pg-graphql-v1"
                      />
                    </div>
                    <div
                      className={`min-h-[400px] relative group/day5step2 flex-1 flex flex-col items-center justify-between basis-1/2 lg:basis-1/3 border rounded-xl bg-no-repeat p-14 text-2xl overflow-hidden`}
                    >
                      <div className={`absolute top-0 right-0 w-full h-full -z-20`}>
                        <Image
                          src={'/images/launchweek/custom-domains-visual.svg'}
                          layout="fill"
                          objectFit="cover"
                          quality={100}
                          priority
                          className="left-16"
                        />
                      </div>
                      <div
                        className={`absolute top-0 right-0 w-full h-full -z-10 opacity-0 group-hover/day5step2:opacity-100 duration-500 transition-all`}
                      >
                        <Image
                          src={'/images/launchweek/custom-domains-visual-hover.svg'}
                          layout="fill"
                          objectFit="cover"
                          quality={100}
                          className="test"
                        />
                      </div>
                      <div className="flex flex-col items-center gap-2 min-w-[300px]">
                        <StyledArticleBadge>New</StyledArticleBadge>
                        <span className="text-black dark:text-white text-center">
                          Custom Domains
                        </span>
                      </div>
                      <SectionButtons
                        docs="/docs/guides/platform/custom-domains"
                        blog="/blog/custom-domain-names"
                      />
                    </div>
                    <div
                      className={`min-h-[400px] relative group/day5step2 flex-1 flex flex-col items-center justify-between basis-1/2 lg:basis-1/3 border rounded-xl bg-no-repeat p-14 text-2xl overflow-hidden`}
                    >
                      <div className={`absolute top-0 right-0 w-full h-full -z-20`}>
                        <Image
                          src={'/images/launchweek/PITR-visual.svg'}
                          layout="fill"
                          objectFit="cover"
                          quality={100}
                          priority
                          className="left-16"
                        />
                      </div>
                      <div
                        className={`absolute top-0 right-0 w-full h-full -z-10 opacity-0 group-hover/day5step2:opacity-100 duration-500 transition-all`}
                      >
                        <Image
                          src={'/images/launchweek/PITR-visual-hover.svg'}
                          layout="fill"
                          objectFit="cover"
                          quality={100}
                          className="test"
                        />
                      </div>
                      <div className="flex flex-col items-center gap-2 min-w-[300px]">
                        <StyledArticleBadge>New</StyledArticleBadge>
                        <span className="text-black dark:text-white text-center">
                          Point-in-time recovery
                        </span>
                      </div>
                      <SectionButtons
                        docs="/docs/guides/platform/going-into-prod"
                        blog="/blog/postgres-point-in-time-recovery"
                      />
                    </div>
                    <div
                      className={`min-h-[400px] relative group/day5step2 flex-1 flex flex-col items-center justify-between basis-1/2 lg:basis-1/3 border rounded-xl bg-no-repeat p-14 text-2xl overflow-hidden`}
                    >
                      <div className={`absolute top-0 right-0 w-full h-full -z-20`}>
                        <Image
                          src={'/images/launchweek/pg_crdt-visual.svg'}
                          layout="fill"
                          objectFit="cover"
                          quality={100}
                          priority
                          className="left-16"
                        />
                      </div>
                      <div
                        className={`absolute top-0 right-0 w-full h-full -z-10 opacity-0 group-hover/day5step2:opacity-100 duration-500 transition-all`}
                      >
                        <Image
                          src={'/images/launchweek/pg_crdt-visual-hover.svg'}
                          layout="fill"
                          objectFit="cover"
                          quality={100}
                          className="test"
                        />
                      </div>
                      <div className="flex flex-col items-center gap-2 min-w-[300px]">
                        <StyledArticleBadge>Experimental</StyledArticleBadge>
                        <span className="text-black dark:text-white text-center">pg_crdt</span>
                      </div>
                      <SectionButtons
                        docs="https://github.com/supabase/pg_crdt"
                        blog="/blog/postgres-crdt"
                      />
                    </div>
                    <div
                      className={`min-h-[400px] relative group/day5step2 flex-1 flex flex-col items-center justify-between basis-1/2 lg:basis-1/3 border rounded-xl bg-no-repeat p-14 text-2xl overflow-hidden`}
                    >
                      <div className={`absolute top-0 right-0 w-full h-full -z-20`}>
                        <Image
                          src={'/images/launchweek/postgres-visual.svg'}
                          layout="fill"
                          objectFit="cover"
                          quality={100}
                          priority
                          className="left-16"
                        />
                      </div>
                      <div
                        className={`absolute top-0 right-0 w-full h-full -z-10 opacity-0 group-hover/day5step2:opacity-100 duration-500 transition-all`}
                      >
                        <Image
                          src={'/images/launchweek/postgres-visual-hover.svg'}
                          layout="fill"
                          objectFit="cover"
                          quality={100}
                          className="test"
                        />
                      </div>
                      <div className="flex flex-col items-center gap-2 min-w-[300px]">
                        <StyledArticleBadge>Upgrade</StyledArticleBadge>
                        <span className="text-black dark:text-white text-center">Postgres 15</span>
                      </div>
                      <SectionButtons
                        docs="https://www.postgresql.org/docs/15/release-15.html"
                        blog="/blog/new-in-postgres-15"
                      />
                    </div>
                    <div
                      className={`min-h-[400px] relative group/day5step2 flex-1 flex flex-col items-center justify-between basis-1/2 lg:basis-1/3 border rounded-xl bg-no-repeat p-14 text-2xl overflow-hidden`}
                    >
                      <div className={`absolute top-0 right-0 w-full h-full -z-20`}>
                        <Image
                          src={'/images/launchweek/PostgREST11-visual.svg'}
                          layout="fill"
                          objectFit="cover"
                          quality={100}
                          priority
                          className="left-16"
                        />
                      </div>
                      <div
                        className={`absolute top-0 right-0 w-full h-full -z-10 opacity-0 group-hover/day5step2:opacity-100 duration-500 transition-all`}
                      >
                        <Image
                          src={'/images/launchweek/PostgREST11-visual-hover.svg'}
                          layout="fill"
                          objectFit="cover"
                          quality={100}
                          className="test"
                        />
                      </div>
                      <div className="flex flex-col items-center gap-2 min-w-[300px]">
                        <StyledArticleBadge>Upgrade</StyledArticleBadge>
                        <span className="text-black dark:text-white text-center">PostgREST 11</span>
                      </div>
                      <SectionButtons
                        docs="/docs/guides/resources/supabase-cli"
                        blog="/blog/postgrest-11-prerelease"
                      />
                    </div>
                  </div>
                </>
              )}
            </Accordion.Item>
          </div>
        </Accordion>
      </SectionContainer>
    </>
  )
}
