// @ts-nocheck

import { NextSeo } from 'next-seo'
import Image from 'next/image'

import _days from '~/components/LaunchWeek/6/lw6_days.json'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import classNames from 'classnames'
import { SITE_ORIGIN } from '~/lib/constants'
import { Accordion, Badge, IconExternalLink } from 'ui'
import { WeekDayProps } from './types6'

import styleUtils from './styles/utils6.module.css'
import styles from './styles/launchWeek6.module.css'

const days = _days as WeekDayProps[]
const constellation = [
  [60, 8],
  [13, 20],
  [42, 24],
  [68, 27],
  [23, 42],
  [52, 52],
  [0, 55],
  [33, 65],
  [66, 70],
  [55, 82],
]

export default function launchweek() {
  const { resolvedTheme } = useTheme()
  const title = 'Launch Week 6'
  const description = 'Supabase Launch Week 6 | 12-18 Dec 2022'
  const liveDay = null

  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)

  const [creators, setCreators] = useState<any>([])
  const [activeCreator, setActiveCreator] = useState<any>(null)
  const { query } = useRouter()
  const ticketNumber = query.ticketNumber?.toString()

  useEffect(() => {
    if (!supabase) {
      setSupabase(
        createClient(
          process.env.NEXT_PUBLIC_MISC_USE_URL!,
          process.env.NEXT_PUBLIC_MISC_USE_ANON_KEY!
        )
      )
    }
  }, [])

  useEffect(() => {
    if (supabase) {
      getCreators()
    }
  }, [supabase])

  async function getCreators() {
    try {
      // setLoading(true)
      let supa = await supabase.from('lw6_creators').select()

      let { data, error, status } = supa

      if (error && status !== 406) {
        throw error
      }

      if (data) {
        setCreators(data)
      }
    } catch (error) {
      // alert('Error loading user data!')
      console.log(error)
    } finally {
      // setLoading(false)
    }
  }

  const AccordionHeader = ({ date, day, title, shipped }: any) => {
    return (
      <div className="flex flex-1 flex-col sm:flex-row">
        <div className="flex gap-4 min-w-[380px] items-center">
          <Badge
            className={`!bg-transparent !py-1 !px-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-[#DFFFF1] !border-[#DFFFF1] h-fit relative ${
              shipped
                ? 'after:absolute after:rounded-full after:bg-white after:w-full after:h-full after:top-0 after:right-0 after:bottom-0 after:left-0 after:bg-gradient-to-br text-transparent !border-[#163837] after:from-[#14292c] after:to-[#141516] after:border-[#1f3536] after:-z-10 '
                : ''
            }`}
          >
            {shipped ? 'Shipped' : 'Coming Soon'}
          </Badge>

          <span className="text-[#707070] text-sm">
            {day} ・ {date}
          </span>
        </div>
        <span className="text-[#ededed] mt-3 sm:mt-0">{title}</span>
      </div>
    )
  }

  const SectionButtons = ({ blog, docs, video }) => {
    return (
      <div className="flex gap-2 z-10">
        <a href={blog} target="_blank" rel="noopener">
          <div className="flex items-center border border-[#2E2E2E] bg-gradient-to-r text-white from-[#191919] to-[#464444] hover:to-[#4e4e4e] rounded-full text-sm py-2 pl-3 pr-2">
            Blog post
            <div className="bg-[#313131] rounded-full inline-block p-1 ml-2">
              <img src="/images/launchweek/icons-blogpost.svg" className="w-4 h-4"></img>
            </div>
          </div>
        </a>
        {docs && (
          <a href={docs} target="_blank" rel="noopener">
            <div className="flex items-center border border-[#2E2E2E] bg-gradient-to-r text-white from-[#191919] to-[#464444] hover:to-[#4e4e4e] rounded-full text-sm py-2 pl-3 pr-2">
              Docs
              <div className="bg-[#313131] rounded-full inline-block p-1 ml-2">
                <img src="/images/launchweek/icons-docs.svg" className="w-4 h-4"></img>
              </div>
            </div>
          </a>
        )}
        {video && (
          <a href={video} target="_blank" rel="noopener">
            <div className="flex items-center border border-[#2E2E2E] bg-gradient-to-r text-white from-[#191919] to-[#464444] hover:to-[#4e4e4e] rounded-full text-sm py-2 pl-3 pr-2">
              Video
              <div className="bg-[#313131] rounded-full inline-block p-1 ml-2">
                <img src="/images/launchweek/video-icon.svg" className="w-4 h-4"></img>
              </div>
            </div>
          </a>
        )}
      </div>
    )
  }
  const [day1, day2, day3, day4, day5] = days

  return (
    <>
      <NextSeo
        title={title}
        openGraph={{
          title: title,
          description: description,
          url: `https://supabase.com/launch-week`,
          images: [
            {
              url: `${SITE_ORIGIN}/images/launchweek/launch-week-6.jpg`,
            },
          ],
        }}
      />
      <DefaultLayout>
        <SectionContainer className="flex flex-col !pb-1 items-center lg:pt-32 gap-24">
          <div
            className={classNames(
              styleUtils.appear,
              styleUtils['appear-first'],
              'flex flex-col justify-center gap-3'
            )}
          >
            <div className="flex justify-center">
              <img
                src="/images/launchweek/launchweek-logo--dark.svg"
                className="w-40 flex lg:w-80"
              />
            </div>
            <p className="text-foreground-light text-sm text-center">
              Dec 12 – 16 at 6 AM PT | 9 AM ET
            </p>
          </div>
        </SectionContainer>
        <div
          className={classNames(
            styleUtils.appear,
            styleUtils['appear-third'],
            'gradient-container'
          )}
        >
          <div
            className={classNames(styleUtils.appear, styleUtils['appear-fourth'], 'gradient-mask')}
          ></div>
          <div className="gradient-mask--masked bottom-of-the-circle"></div>

          <div
            className={classNames(
              // styleUtils.appear,
              // styleUtils['appear-second'],
              'flair-mask-a the-stroke-of-the-circle'
            )}
          ></div>
          <div
            className={classNames(
              // styleUtils.appear,
              // styleUtils['appear-second'],
              'flair-mask-b inside-the-circle'
            )}
          ></div>
        </div>

        <SectionContainer className="!py-0 ">
          <div className="border border-[#2E2E2E] rounded-2xl text-sm px-5 py-4 flex flex-col sm:flex-row justify-between items-center">
            <div className="relative flex items-center mb-4 sm:mb-0">
              <div className="flex min-w-[150px]">
                <img
                  src={`/images/launchweek/antcopplecall.png`}
                  className="brightness-125"
                  width={120}
                  height={80}
                ></img>
              </div>
              <div className="flex flex-col lg:flex-row ml-8 sm:ml-10">
                <span className="text-white mr-2">Who we hire at Supabase</span>
                <span className="text-slate-900">Fireside chat with founders</span>
              </div>
            </div>
            <div className="flex gap-2 z-10">
              <a href={'https://youtu.be/-BG9XptyCKI'} target="_blank" rel="noopener">
                <div className="flex items-center border border-[#2E2E2E] bg-gradient-to-r text-white from-[#191919] to-[#464444] hover:to-[#4e4e4e] rounded-full text-sm py-2 pl-3 pr-2 min-w-[130px]">
                  Watch video
                  <div className="bg-[#313131] rounded-full inline-block p-1 ml-2">
                    <img src="/images/launchweek/video-icon.svg" className="w-3 h-3"></img>
                  </div>
                </div>
              </a>
              <a href={'/blog/who-we-hire'} target="_blank" rel="noopener">
                <div className="flex items-center border border-[#2E2E2E] bg-gradient-to-r text-white from-[#191919] to-[#464444] hover:to-[#4e4e4e] rounded-full text-sm py-2 pl-3 pr-2 min-w-[142px]">
                  Read blogpost
                  <div className="bg-[#313131] rounded-full inline-block p-1 ml-2">
                    <img src="/images/launchweek/icons-blogpost.svg" className="w-3 h-3"></img>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </SectionContainer>
        <SectionContainer className="!pt-4 ">
          <div className="border border-[#2E2E2E] rounded-2xl text-sm px-5 py-4 flex flex-col sm:flex-row justify-between items-center">
            <div className="relative flex items-center mb-4 sm:mb-0">
              <div className="flex min-w-[150px]">
                <img src={`/images/launchweek/outro.svg`} width={110} height={80}></img>
              </div>
              <div className="flex flex-col lg:flex-row ml-8 sm:ml-10">
                <span className="text-white mr-2">Wrap Up</span>
                <span className="text-slate-900">Everything we shipped</span>
              </div>
            </div>
            <div className="flex gap-2 z-10">
              <a href={'/blog/launch-week-6-wrap-up'} target="_blank" rel="noopener">
                <div className="flex items-center border border-[#2E2E2E] bg-gradient-to-r text-white from-[#191919] to-[#464444] hover:to-[#4e4e4e] rounded-full text-sm py-2 pl-3 pr-2 min-w-[142px]">
                  Read blogpost
                  <div className="bg-[#313131] rounded-full inline-block p-1 ml-2">
                    <img src="/images/launchweek/icons-blogpost.svg" className="w-3 h-3"></img>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </SectionContainer>
        <SectionContainer className="!pt-0">
          <Accordion
            type="default"
            openBehaviour="multiple"
            size="large"
            className="text-white"
            justified={false}
            bordered={false}
            chevronAlign="right"
            defaultValue={[
              day1.d.toString(),
              day2.d.toString(),
              day3.d.toString(),
              day4.d?.toString(),
              day5.d?.toString(),
            ]}
          >
            <div className="border-b border-[#2E2E2E] pb-3">
              <Accordion.Item
                header={
                  <AccordionHeader
                    date={day1.date}
                    day={day1.dd}
                    title={day1.title}
                    shipped={day1.shipped}
                  />
                }
                disabled={!day1.shipped}
                className="h-[79px]"
                id={day1.d.toString()}
              >
                {day1.steps.length > 0 && (
                  <div className="h-[400px] flex flex-col lg:flex-row group/day1 relative overflow-hidden">
                    <div
                      className="absolute group-hover/day1:scale-105 opacity-60 group-hover/day1:opacity-100 w-full h-full -z-10 transition-all duration-500"
                      style={{
                        background: `radial-gradient(650px 150px at 50% 100%, #103633, transparent)`,
                      }}
                    ></div>
                    <div
                      className={`flex flex-col flex-1 items-center gap-5 lg:items-start lg:justify-between border border-[#2E2E2E] rounded-xl h-full relative overflow-hidden after:absolute after:bg-no-repeat after:bg-[center_bottom] lg:after:bg-[right_15%_top_100px] xl:after:bg-[right_15%_top_60px] after:bg-[length:300px_180px] after:lg:bg-[length:450px_300px] after:xl:bg-[length:528px_367px] after:bg-[url('/images/launchweek/docs-update-bg.png')] after:top-0 after:right-0 after:bottom-0 after:left-0 p-14 text-2xl before:absolute before:w-full before:h-full before:top-52 before:right-0 before:bottom-0 before:left-0 before:border-[#1f3536] before:-z-10 !px-3 sm:!px-14`}
                    >
                      <div className="flex items-center relative z-10 justify-between flex-col-reverse lg:flex-row lg:justify-start gap-2 text-white">
                        <span>{day1.description}</span>
                        <Badge className="!bg-transparent h-fit lg:ml-4 text-sm !py-1 !px-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-[#DFFFF1] border-[#DFFFF1]">
                          Redesigned
                        </Badge>
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
            <div className="border-b border-[#2E2E2E] pb-3">
              <Accordion.Item
                header={
                  <AccordionHeader
                    date={day2.date}
                    day={day2.dd}
                    title={day2.title}
                    shipped={day2.shipped}
                  />
                }
                disabled={!day2.shipped}
                className="h-[79px]"
                id={day2.d.toString()}
              >
                {day2.steps.length > 0 && (
                  <div className="h-[800px] lg:h-[400px] flex flex-col gap-5 lg:flex-row">
                    <div
                      className={`relative overflow-hidden group/2 flex-1 flex flex-col items-center gap-5 lg:items-start justify-between basis-1/2 lg:basis-2/3 border border-[#2E2E2E] rounded-xl h-full p-14 xs:text-2xl text-xl text-center bg-no-repeat bg-[url('/images/launchweek/image-processing-bg-alt.png')] xs:bg-[url('/images/launchweek/image-processing-bg.png')] bg-[right_30px_top_35px] lg:bg-[top_25px_right_25px] bg-contain`}
                    >
                      <div
                        className="top-0 absolute group-hover/2:scale-105 opacity-60 group-hover/2:opacity-100 w-full h-full -z-10 transition-all duration-500"
                        style={{
                          background: `radial-gradient(90% 130px at 80% 0px, #103633, transparent)`,
                        }}
                      ></div>
                      <div className="flex items-center justify-between flex-col-reverse lg:flex-row lg:justify-start gap-2 text-white">
                        <div>{day2.steps[0].title}</div>
                        <Badge className="!bg-transparent h-fit lg:ml-4 text-sm !py-1 !px-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-[#1a7a4ca1] border-[#DFFFF1]">
                          New
                        </Badge>
                      </div>
                      <SectionButtons docs={day2.steps[0].docs} blog={day2.steps[0].blog} />
                    </div>
                    <div
                      className={`relative overflow-hidden group/3 flex-1 flex flex-col items-center justify-between basis-1/2 lg:basis-1/3 border border-[#2E2E2E] rounded-xl h-full bg-no-repeat p-14 text-2xl bg-[url('/images/launchweek/cdn-caching-bg.png')] bg-[top_170px_center] lg:bg-[center_bottom] bg-contain`}
                    >
                      <div
                        className="top-0 absolute group-hover/3:scale-105 opacity-60 group-hover/3:opacity-100 w-full h-full -z-10 transition-all duration-500"
                        style={{
                          background: `radial-gradient(90% 130px at 50% 0px, #103633, transparent)`,
                        }}
                      ></div>
                      <div className="flex flex-col items-center gap-2 min-w-[300px]">
                        <Badge className="!bg-transparent h-fit text-sm !py-1 !px-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-[#1a7a4ca1] border-[#DFFFF1]">
                          New
                        </Badge>
                        <span className="text-white">{day2.steps[1].title}</span>
                        <p className="text-sm text-slate-900">{day2.steps[1].description}</p>
                      </div>
                      <SectionButtons docs={day2.steps[1].docs} blog={day2.steps[1].blog} />
                    </div>
                  </div>
                )}
              </Accordion.Item>
            </div>
            <div className="border-b border-[#2E2E2E] pb-3">
              <Accordion.Item
                header={
                  <AccordionHeader
                    date={day3.date}
                    day={day3.dd}
                    title={day3.title}
                    shipped={day3.shipped}
                  />
                }
                disabled={!day3.shipped}
                className="h-[79px]"
                id={day3.d.toString()}
              >
                {day3.steps.length > 0 && (
                  <div className="h-[400px] flex gap-5 group">
                    <div
                      className={`flex flex-col text-center items-center lg:items-start justify-between flex-1 border border-[#2E2E2E] rounded-xl h-full bg-no-repeat p-14 text-2xl relative`}
                    >
                      <div className="absolute top-0 right-0 w-full h-full -z-20 ">
                        <Image
                          src={'/images/launchweek/mfa-dark.png'}
                          fill
                          className="object-cover"
                          quality={100}
                          priority
                        />
                      </div>
                      <div className="absolute top-0 right-0 w-full h-full -z-10 opacity-0 group-hover:opacity-100 duration-500 transition-all">
                        <Image
                          src={'/images/launchweek/mfa-dark-hover.png'}
                          fill
                          className="object-cover"
                          quality={100}
                        />
                      </div>

                      <div className="flex items-center justify-between flex-col-reverse lg:flex-row lg:justify-start text-white">
                        <span>{day3.steps[0].title}</span>
                        <Badge className="!bg-transparent h-fit lg:ml-4 text-sm !py-1 !px-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-[#1a7a4ca1] border-[#DFFFF1]">
                          Updated
                        </Badge>
                      </div>
                      <SectionButtons docs={day3.steps[0].docs} blog={day3.steps[0].blog} />
                    </div>
                  </div>
                )}
              </Accordion.Item>
            </div>
            <div className="border-b border-[#2E2E2E] pb-3">
              <Accordion.Item
                header={
                  <AccordionHeader
                    date={day4.date}
                    day={day4.dd}
                    title={day4.title}
                    shipped={day4.shipped}
                  />
                }
                disabled={!day4.shipped}
                className="h-[79px]"
                id={day4.d.toString()}
              >
                {day4.steps.length > 0 && (
                  <div className="h-[400px]  flex flex-col gap-5 lg:flex-row group/day4 relative overflow-hidden">
                    <div
                      className={`relative flex flex-col items-center justify-between lg:items-start flex-1 basis-1/2 lg:basis-2/3 border border-[#2E2E2E] rounded-xl h-full p-14 text-2xl bg-no-repeat bg-cover !px-3 sm:!px-14`}
                    >
                      <div
                        className={`absolute top-0 right-0 w-full h-full -z-20 ${styles.wrappers}`}
                      >
                        <Image
                          src={'/images/launchweek/wrappers-visual.svg'}
                          fill
                          quality={100}
                          priority
                          className="left-16 object-cover"
                        />
                      </div>
                      <div
                        className={`absolute top-0 right-0 w-full h-full -z-10 opacity-0 group-hover/day4:opacity-100 duration-500 transition-all ${styles.wrappers}`}
                      >
                        <Image
                          src={'/images/launchweek/wrappers-visual-hover.svg'}
                          fill
                          quality={100}
                          className="test object-cover"
                        />
                      </div>
                      <div className="flex items-center flex-col-reverse lg:flex-row text-white">
                        <span>{day4.steps[0].title}</span>
                        <Badge className="!bg-transparent h-fit lg:ml-4 text-sm !py-1 !px-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-[#1a7a4ca1] border-[#DFFFF1]">
                          New
                        </Badge>
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
            <div className="border-b border-[#2E2E2E] pb-3" id="currentDay">
              <Accordion.Item
                header={
                  <AccordionHeader
                    date={day5.date}
                    day={day5.dd}
                    title={day5.title}
                    shipped={day5.shipped}
                  />
                }
                disabled={!day5.shipped}
                className="h-[79px]"
                id={day5.d.toString()}
              >
                {day5.steps.length > 0 && (
                  <>
                    <div className="h-[800px] lg:h-[400px]  flex flex-col gap-5 lg:flex-row">
                      <div
                        className={`relative group/day5step1 flex flex-col items-center justify-between lg:items-start flex-1 basis-1/2 lg:basis-2/3 border border-[#2E2E2E] rounded-xl h-full bg-no-repeat p-14 text-2xl overflow-hidden`}
                      >
                        <div
                          className={`absolute top-0 right-0 w-full h-full -z-20 ${styles.wrappers}`}
                        >
                          <Image
                            src={'/images/launchweek/vault-visual.svg'}
                            fill
                            quality={100}
                            priority
                            className="left-16 object-cover"
                          />
                        </div>
                        <div
                          className={`absolute top-0 right-0 w-full h-full -z-10 opacity-0 group-hover/day5step1:opacity-100 duration-500 transition-all ${styles.wrappers}`}
                        >
                          <Image
                            src={'/images/launchweek/vault-visual-hover.svg'}
                            fill
                            quality={100}
                            className="test object-cover"
                          />
                        </div>
                        <div className="flex items-center flex-col-reverse lg:flex-row">
                          <span className="text-white">{day5.steps[0].title}</span>
                          <Badge className="!bg-transparent h-fit lg:ml-4 text-sm !py-1 !px-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-[#1a7a4ca1] border-[#DFFFF1]">
                            New
                          </Badge>
                        </div>
                        <SectionButtons docs={day5.steps[0].docs} blog={day5.steps[0].blog} />
                      </div>
                      <div
                        className={`relative group/day5step2 flex-1 flex flex-col items-center justify-between basis-1/2 lg:basis-1/3 border border-[#2E2E2E] rounded-xl h-full bg-no-repeat p-14 text-2xl overflow-hidden`}
                      >
                        <div className={`absolute top-0 right-0 w-full h-full -z-20`}>
                          <Image
                            src={'/images/launchweek/TCE-visual.svg'}
                            fill
                            quality={100}
                            priority
                            className="left-16 object-cover"
                          />
                        </div>
                        <div
                          className={`absolute top-0 right-0 w-full h-full -z-10 opacity-0 group-hover/day5step2:opacity-100 duration-500 transition-all`}
                        >
                          <Image
                            src={'/images/launchweek/TCE-visual-hover.svg'}
                            fill
                            quality={100}
                            className="test object-cover"
                          />
                        </div>
                        <div className="flex flex-col items-center gap-2 min-w-[300px]">
                          <Badge className="!bg-transparent h-fit ml-4 text-sm !py-1 !px-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-[#1a7a4ca1] border-[#DFFFF1]">
                            New
                          </Badge>
                          <span className="text-white text-center">{day5.steps[1].title}</span>
                        </div>
                        <SectionButtons docs={day5.steps[1].docs} blog={day5.steps[1].blog} />
                      </div>
                    </div>
                    <h3 className="text-white text-lg mb-4 mt-4">Community</h3>
                    <div className="h-[400px] flex flex-col gap-5 lg:flex-row group/community relative overflow-hidden">
                      <div
                        className={`relative flex flex-col items-center justify-between lg:items-start flex-1 basis-1/2 lg:basis-2/3 border border-[#2E2E2E] rounded-xl h-full p-14 text-2xl bg-no-repeat bg-cover !px-3 sm:!px-14`}
                      >
                        <div
                          className={`absolute top-0 right-0 w-full h-full -z-20 ${styles.community_wrappers}`}
                        >
                          <Image
                            src={'/images/launchweek/community-visual.svg'}
                            fill
                            quality={100}
                            priority
                            className="left-16 object-cover"
                          />
                        </div>
                        <div
                          className={`absolute top-0 right-0 w-full h-full -z-10 opacity-0 group-hover/community:opacity-100 duration-500 transition-all ${styles.community_wrappers}`}
                        >
                          <Image
                            src={'/images/launchweek/community-visual-hover.svg'}
                            fill
                            quality={100}
                            className="test object-cover"
                          />
                        </div>
                        <div className="flex items-center flex-col-reverse lg:flex-row">
                          <span className="text-white">Community Day</span>
                        </div>
                        <div className="flex flex-col md:flex-row gap-4 md:gap-2 z-10 ">
                          <div className="flex gap-4 md:gap-2">
                            <a
                              href={'/blog/launch-week-6-community-day'}
                              target="_blank"
                              rel="noopener"
                            >
                              <div className="flex items-center border border-[#2E2E2E] bg-gradient-to-r text-white from-[#191919] to-[#464444] hover:to-[#4e4e4e] rounded-full text-sm py-2 pl-3 pr-2">
                                Blog post
                                <div className="bg-[#313131] rounded-full inline-block p-1 ml-2">
                                  <img
                                    src="/images/launchweek/icons-blogpost.svg"
                                    className="w-4 h-4"
                                  ></img>
                                </div>
                              </div>
                            </a>
                            <a
                              href={'https://www.youtube.com/watch?v=hw9Q-NjASbU'}
                              target="_blank"
                              rel="noopener"
                            >
                              <div className="flex items-center border border-[#2E2E2E] bg-gradient-to-r text-white from-[#191919] to-[#464444] hover:to-[#4e4e4e] rounded-full text-sm py-2 pl-3 pr-2">
                                Flutterflow
                                <div className="bg-[#313131] rounded-full inline-block p-1 ml-2">
                                  <img
                                    src="/images/launchweek/video-icon.svg"
                                    className="w-4 h-4"
                                  ></img>
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
                              <div className="flex items-center border border-[#2E2E2E] bg-gradient-to-r text-white from-[#191919] to-[#464444] hover:to-[#4e4e4e] rounded-full text-sm py-2 pl-3 pr-2">
                                OneSignal
                                <div className="bg-[#313131] rounded-full inline-block p-1 ml-2">
                                  <img
                                    src="/images/launchweek/video-icon.svg"
                                    className="w-4 h-4"
                                  ></img>
                                </div>
                              </div>
                            </a>
                            <a
                              href={'https://www.youtube.com/watch?v=EdYQ9fF-hz4'}
                              target="_blank"
                              rel="noopener"
                            >
                              <div className="flex items-center border border-[#2E2E2E] bg-gradient-to-r text-white from-[#191919] to-[#464444] hover:to-[#4e4e4e] rounded-full text-sm py-2 pl-3 pr-2">
                                NextAuth
                                <div className="bg-[#313131] rounded-full inline-block p-1 ml-2">
                                  <img
                                    src="/images/launchweek/video-icon.svg"
                                    className="w-4 h-4"
                                  ></img>
                                </div>
                              </div>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                    <h3 className="text-white text-lg mb-4 mt-4">One more thing</h3>
                    <div className="flex flex-col lg:grid grid-cols-3 grid-rows-2 gap-4">
                      <div
                        className={`min-h-[400px] relative group/day5step2 flex-1 flex flex-col items-center justify-between basis-1/2 lg:basis-1/3 border border-[#2E2E2E] rounded-xl bg-no-repeat p-14 text-2xl overflow-hidden`}
                      >
                        <div className={`absolute top-0 right-0 w-full h-full -z-20`}>
                          <Image
                            src={'/images/launchweek/PgGraphql-visual.svg'}
                            fill
                            quality={100}
                            priority
                            className="left-16 object-cover"
                          />
                        </div>
                        <div
                          className={`absolute top-0 right-0 w-full h-full -z-10 opacity-0 group-hover/day5step2:opacity-100 duration-500 transition-all`}
                        >
                          <Image
                            src={'/images/launchweek/PgGraphql-visual-hover.svg'}
                            fill
                            quality={100}
                            className="test object-cover"
                          />
                        </div>
                        <div className="flex flex-col items-center gap-2 min-w-[300px]">
                          <Badge className="!bg-transparent h-fit text-sm !py-1 !px-4 text-transparent bg-clip-text bg-gradient-to-r  from-white to-[#1a7a4ca1] border-[#DFFFF1]">
                            Updated
                          </Badge>
                          <span className="text-white text-center">pg_graphql v1.0</span>
                        </div>
                        <SectionButtons
                          docs="/docs/guides/api#graphql-api"
                          blog="/blog/pg-graphql-v1"
                        />
                      </div>
                      <div
                        className={`min-h-[400px] relative group/day5step2 flex-1 flex flex-col items-center justify-between basis-1/2 lg:basis-1/3 border border-[#2E2E2E] rounded-xl bg-no-repeat p-14 text-2xl overflow-hidden`}
                      >
                        <div className={`absolute top-0 right-0 w-full h-full -z-20`}>
                          <Image
                            src={'/images/launchweek/custom-domains-visual.svg'}
                            fill
                            quality={100}
                            priority
                            className="left-16 object-cover"
                          />
                        </div>
                        <div
                          className={`absolute top-0 right-0 w-full h-full -z-10 opacity-0 group-hover/day5step2:opacity-100 duration-500 transition-all`}
                        >
                          <Image
                            src={'/images/launchweek/custom-domains-visual-hover.svg'}
                            fill
                            quality={100}
                            className="test object-cover"
                          />
                        </div>
                        <div className="flex flex-col items-center gap-2 min-w-[300px]">
                          <Badge className="!bg-transparent h-fit text-sm !py-1 !px-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-[#1a7a4ca1] border-[#DFFFF1]">
                            New
                          </Badge>
                          <span className="text-white text-center">Custom Domains</span>
                        </div>
                        <SectionButtons
                          docs="/docs/guides/platform/custom-domains"
                          blog="/blog/custom-domain-names"
                        />
                      </div>
                      <div
                        className={`min-h-[400px] relative group/day5step2 flex-1 flex flex-col items-center justify-between basis-1/2 lg:basis-1/3 border border-[#2E2E2E] rounded-xl bg-no-repeat p-14 text-2xl overflow-hidden`}
                      >
                        <div className={`absolute top-0 right-0 w-full h-full -z-20`}>
                          <Image
                            src={'/images/launchweek/PITR-visual.svg'}
                            fill
                            quality={100}
                            priority
                            className="left-16 object-cover"
                          />
                        </div>
                        <div
                          className={`absolute top-0 right-0 w-full h-full -z-10 opacity-0 group-hover/day5step2:opacity-100 duration-500 transition-all`}
                        >
                          <Image
                            src={'/images/launchweek/PITR-visual-hover.svg'}
                            fill
                            quality={100}
                            className="test object-cover"
                          />
                        </div>
                        <div className="flex flex-col items-center gap-2 min-w-[300px]">
                          <Badge className="!bg-transparent h-fit text-sm !py-1 !px-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-[#1a7a4ca1] border-[#DFFFF1]">
                            New
                          </Badge>
                          <span className="text-white text-center">Point-in-time recovery</span>
                        </div>
                        <SectionButtons
                          docs="/docs/guides/platform/going-into-prod"
                          blog="/blog/postgres-point-in-time-recovery"
                        />
                      </div>
                      <div
                        className={`min-h-[400px] relative group/day5step2 flex-1 flex flex-col items-center justify-between basis-1/2 lg:basis-1/3 border border-[#2E2E2E] rounded-xl bg-no-repeat p-14 text-2xl overflow-hidden`}
                      >
                        <div className={`absolute top-0 right-0 w-full h-full -z-20`}>
                          <Image
                            src={'/images/launchweek/pg_crdt-visual.svg'}
                            fill
                            quality={100}
                            priority
                            className="left-16 object-cover"
                          />
                        </div>
                        <div
                          className={`absolute top-0 right-0 w-full h-full -z-10 opacity-0 group-hover/day5step2:opacity-100 duration-500 transition-all`}
                        >
                          <Image
                            src={'/images/launchweek/pg_crdt-visual-hover.svg'}
                            fill
                            quality={100}
                            className="test object-cover"
                          />
                        </div>
                        <div className="flex flex-col items-center gap-2 min-w-[300px]">
                          <Badge className="!bg-transparent h-fit text-sm !py-1 !px-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-[#1a7a4ca1] border-[#DFFFF1]">
                            Experimental
                          </Badge>
                          <span className="text-white text-center">pg_crdt</span>
                        </div>
                        <SectionButtons
                          docs="https://github.com/supabase/pg_crdt"
                          blog="/blog/postgres-crdt"
                        />
                      </div>
                      <div
                        className={`min-h-[400px] relative group/day5step2 flex-1 flex flex-col items-center justify-between basis-1/2 lg:basis-1/3 border border-[#2E2E2E] rounded-xl bg-no-repeat p-14 text-2xl overflow-hidden`}
                      >
                        <div className={`absolute top-0 right-0 w-full h-full -z-20`}>
                          <Image
                            src={'/images/launchweek/postgres-visual.svg'}
                            fill
                            quality={100}
                            priority
                            className="left-16 object-cover"
                          />
                        </div>
                        <div
                          className={`absolute top-0 right-0 w-full h-full -z-10 opacity-0 group-hover/day5step2:opacity-100 duration-500 transition-all`}
                        >
                          <Image
                            src={'/images/launchweek/postgres-visual-hover.svg'}
                            fill
                            quality={100}
                            className="test object-cover"
                          />
                        </div>
                        <div className="flex flex-col items-center gap-2 min-w-[300px]">
                          <Badge className="!bg-transparent h-fit text-sm !py-1 !px-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-[#1a7a4ca1] border-[#DFFFF1]">
                            Upgrade
                          </Badge>
                          <span className="text-white text-center">Postgres 15</span>
                        </div>
                        <SectionButtons
                          docs="https://www.postgresql.org/docs/15/release-15.html"
                          blog="/blog/new-in-postgres-15"
                        />
                      </div>
                      <div
                        className={`min-h-[400px] relative group/day5step2 flex-1 flex flex-col items-center justify-between basis-1/2 lg:basis-1/3 border border-[#2E2E2E] rounded-xl bg-no-repeat p-14 text-2xl overflow-hidden`}
                      >
                        <div className={`absolute top-0 right-0 w-full h-full -z-20`}>
                          <Image
                            src={'/images/launchweek/PostgREST11-visual.svg'}
                            fill
                            quality={100}
                            priority
                            className="left-16 object-cover"
                          />
                        </div>
                        <div
                          className={`absolute top-0 right-0 w-full h-full -z-10 opacity-0 group-hover/day5step2:opacity-100 duration-500 transition-all`}
                        >
                          <Image
                            src={'/images/launchweek/PostgREST11-visual-hover.svg'}
                            fill
                            quality={100}
                            className="test object-cover"
                          />
                        </div>
                        <div className="flex flex-col items-center gap-2 min-w-[300px]">
                          <Badge className="!bg-transparent h-fit text-sm !py-1 !px-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-[#1a7a4ca1] border-[#DFFFF1]">
                            Upgrade
                          </Badge>
                          <span className="text-white text-center">PostgREST 11</span>
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

        <SectionContainer className="!py-20 sm:!pb-40 sm:!pt-10"></SectionContainer>

        <SectionContainer className="!pt-0 sm:!pb-20 !pb-40"></SectionContainer>
        <SectionContainer className="!pt-0 sm:!pb-20 !pb-40">
          <div className="flex flex-col mb-16">
            <Badge
              className={`w-fit !bg-transparent !py-1 !px-4 bg-clip-text bg-gradient-to-r from-white to-[#DFFFF1] h-fit relative mb-4 after:absolute after:rounded-full text-black after:bg-white after:w-full after:h-full after:top-0 after:right-0 after:bottom-0 after:left-0 after:bg-gradient-to-br text-transparent !border-[#163837] after:from-[#14292c] after:to-[#141516] after:border-[#1f3536] after:-z-10`}
            >
              Submissions Closed
            </Badge>
            <h2 className="text-3xl text-white mb-2">Launch Week Hackathon</h2>
            <p className="text-slate-900 w-[80%] lg:w-[50%]">
              The traditional parallel Hackathon is back! Build a new open source project with
              Supabase and you can win $1500 in GitHub sponsorships and a coveted Supabase Darkmode
              Keyboard! For more info check the{' '}
              <a
                href="https://supabase.com/blog/launch-week-6-hackathon"
                target="_blank"
                rel="nooper noreferrer"
                className="text-brand"
              >
                blog post
              </a>
              .
            </p>
          </div>
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-0">
            <div className="sm:grid grid-cols-2 grid-rows-2 gap-x-4 gap-y-7 sm:gap-y-10 basis-2/3 flex flex-col">
              <div className="flex flex-col">
                <h3 className="text-lg text-white mb-2">Prizes</h3>
                <p className="text-slate-900 w-[90%] lg:w-[80%]">
                  There are 5 categories to win, with prizes for winners and runner-ups of each
                  category. Each team member gets a prize.
                </p>
              </div>
              <div className="flex flex-col">
                <h3 className="text-lg text-white mb-2">Judges</h3>
                <p className="text-slate-900 w-[90%] lg:w-[80%]">
                  The Supabase team will judge all the categories except the Best Edge Functions
                  Project, which will be judged by our friends at Deno.
                </p>
              </div>
              <div className="flex flex-col">
                <div className="flex flex-col">
                  <h3 className="text-lg text-white mb-2">Community</h3>
                  <p className="text-slate-900 w-[90%] lg:w-[80%]">
                    If you need help or advice when building, find other people to join your team,
                    or if you just want to chill and watch people build, come and join us!
                  </p>
                  <div></div>
                  <a
                    href="https://discord.supabase.com/"
                    rel="noopener noreferrer"
                    className="text-brand flex items-center"
                    target="_blank"
                  >
                    Join our Discord <IconExternalLink size="small" className="inline-block ml-2" />
                  </a>
                </div>
              </div>
              <div className={'flex flex-col'}>
                <h3 className="text-lg text-white mb-2">Submission</h3>
                <p className="text-slate-900 w-[90%] lg:w-[80%]">
                  Submit your project through{' '}
                  <a
                    className="text-brand"
                    href="https://www.madewithsupabase.com/launch-week-6"
                    target="_blank"
                  >
                    madewithsupabase.com
                  </a>
                  . All submissions must be open source and publically available. Submissions close
                  Monday 19th Dec 00:01 AM PT.
                </p>
              </div>
            </div>
            <div
              className={classNames(
                // isDarkMode ? styles.dark_community : styles.community,
                styles.dark_community,
                'flex basis-1/3 flex-col p-5'
              )}
            >
              <a
                href="https://github.com/psteinroe/supabase-cache-helpers"
                target="_blank"
                rel="noopener noreferrer"
                className="self-end mb-4"
              >
                <div className="border border-[#2E2E2E] rounded-xl pl-5 pr-9 py-4 bg-background w-fit relative max-w-[250px]">
                  <img
                    src="/images/launchweek/link.svg"
                    className="absolute top-[16px] right-[10px] text-brand"
                  ></img>
                  <h3 className="text-white">Supabase Cache Helpers</h3>
                  <p className="text-slate-1000 text-xs">Previous Best Overall Project Winner</p>
                </div>
              </a>
              <a
                href="https://github.com/pheralb/superui"
                target="_blank"
                rel="noopener noreferrer"
                className="mb-4 w-fit"
              >
                <div className="border border-[#2E2E2E] rounded-xl pl-5 pr-9 py-4 bg-background w-fit relative max-w-[250px]">
                  <img
                    src="/images/launchweek/link.svg"
                    className="absolute top-[16px] right-[10px] text-brand"
                  />
                  <h3 className="text-white">Super UI</h3>
                  <p className="text-slate-1000 text-xs">Previous Best Overall Project Runner Up</p>
                </div>
              </a>
              <a
                href="https://github.com/Myzel394/quid_faciam_hodie"
                target="_blank"
                rel="noopener noreferrer"
                className="self-end mb-4"
              >
                <div className="border border-[#2E2E2E] rounded-xl pl-5 pr-9 py-4 bg-background w-fit relative max-w-[250px]">
                  <img
                    src="/images/launchweek/link.svg"
                    className="absolute top-[16px] right-[10px] text-brand"
                  ></img>
                  <h3 className="text-white">Quid Faciam Hodie?</h3>
                  <p className="text-slate-1000 text-xs">Winner Best Flutter Project</p>
                </div>
              </a>
              <a
                href="https://github.com/laznic/hotdogs"
                target="_blank"
                rel="noopener noreferrer"
                className="mb-4 w-fit"
              >
                <div className="border border-[#2E2E2E] rounded-xl pl-5 pr-9 py-4 bg-background w-fit relative max-w-[250px]">
                  <img
                    src="/images/launchweek/link.svg"
                    className="absolute top-[16px] right-[10px] text-brand"
                  ></img>
                  <h3 className="text-white">That Hot Dog Game</h3>
                  <p className="text-slate-1000 text-xs">Previous Winner: Most Fun/Interesting</p>
                </div>
              </a>
              <a
                href="https://github.com/vvidday/repo-watch"
                target="_blank"
                rel="noopener noreferrer"
                className="self-end"
              >
                <div className="border border-[#2E2E2E] rounded-xl pl-5 pr-9 py-4 bg-background w-fit relative max-w-[250px]">
                  <img
                    src="/images/launchweek/link.svg"
                    className="absolute top-[16px] right-[10px] text-brand"
                  ></img>
                  <h3 className="text-white">RepoWatch</h3>
                  <p className="text-slate-1000 text-xs">Previous Winner Best Realtime Project</p>
                </div>
              </a>
            </div>
          </div>
        </SectionContainer>
        <SectionContainer
          className={classNames(
            'flex gap-6 min-h-[350px] !py-3 mb-11 flex-col-reverse md:flex-row mt-24',
            styleUtils.appear,
            styleUtils['appear-third']
          )}
        >
          <div
            className={`flex-1 bg-[url('/images/launchweek/orbit.svg')] bg-auto bg-no-repeat bg-bottom relative min-h-[360px]`} //grid grid-cols-5 grid-rows-5
          >
            {creators.map((creator: any, index: number) => {
              return (
                <div
                  className={`justify-self-center absolute overflow-visible`}
                  onMouseEnter={() => {
                    setActiveCreator(index)
                  }}
                  style={{
                    top: `${constellation[index][0]}%`,
                    left: `${constellation[index][1]}%`,
                  }}
                >
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-brand-600 rounded-full opacity-75 group-hover:opacity-100 group-hover:blur-sm transition duration-500"></div>
                    <a href={creator.link} target="_blank" rel="noopener">
                      <img
                        className="relative rounded-full w-12 h-12 border border-brand hover:shadow-md"
                        src={creator.profile_picture}
                      />
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex-1">
            <Badge className="!bg-transparent !py-1 !px-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-[#DFFFF1] h-fit relative mb-4 after:absolute after:rounded-full after:bg-white after:w-full after:h-full after:top-0 after:right-0 after:bottom-0 after:left-0 after:bg-gradient-to-br !border-[#163837] after:from-[#14292c] after:to-[#141516] after:border-[#1f3536] after:-z-10">
              Shipped
            </Badge>
            <h2 className="text-3xl text-white mb-2">The Supabase Content Storm</h2>
            <p className="text-slate-900 md:max-w-[80%] mb-16">
              We worked with more than 30 content creators from around the world to drop a mountain
              of content simultaneously!
              <a
                rel="noopener"
                target="_blank"
                href="/blog/the-supabase-content-storm"
                className="text-brand flex items-center mt-2"
              >
                See all the content
                <IconExternalLink size="small" className="inline-block ml-1" />
              </a>
            </p>
            {activeCreator !== null && (
              <div className="lg:max-w-[50%] min-h-[120px]">
                <h3 className="text-white">
                  {activeCreator !== null
                    ? `${creators[activeCreator].first_name} ${creators[activeCreator].last_name}`
                    : 'Title'}
                </h3>
                {activeCreator !== null && (
                  <p className="text-slate-900 ">{creators[activeCreator].description}</p>
                )}
                <p className="text-brand mt-1">
                  <a rel="noopener" target="_blank" href={creators[activeCreator].link}>
                    <span>
                      {creators[activeCreator].link_title}
                      <IconExternalLink size="small" className="inline-block ml-2" />
                    </span>
                  </a>
                </p>
              </div>
            )}
          </div>
        </SectionContainer>
      </DefaultLayout>
    </>
  )
}
