// @ts-nocheck
import Image from 'next/image'

import _days from '~/components/LaunchWeek/lw7_days.json'
import SectionContainer from '~/components/Layouts/SectionContainer'

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { useTheme } from 'ui'
import classNames from 'classnames'
import { Accordion, Badge, IconExternalLink } from 'ui'
import { WeekDayProps } from './types6'

import styleUtils from './styles/utils7.module.css'
import styles from './styles/launchWeek7.module.css'
import Link from 'next/link'

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

const CopySvg = () => (
  <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3.71792 10.8251L12.3015 2.24146L14.5953 4.53521L6.01167 13.1188M3.71792 10.8251L2.84219 13.9945L6.01167 13.1188M3.71792 10.8251L6.01167 13.1188"
      stroke="#A69DC9"
      stroke-miterlimit="10"
      stroke-linejoin="bevel"
    />
  </svg>
)

const SmallCard = ({ className, children }) => (
  <div className="relative p-[1px] bg-gradient-to-b from-[#484848] to-[#1C1C1C] rounded-2xl overflow-hidden">
    <div
      className={[
        'rounded-2xl text-sm px-6 py-4 flex flex-col sm:flex-row justify-between items-center',
        styles['lw7-article-card-gradient'],
        className,
      ].join(' ')}
    >
      {children}
    </div>
  </div>
)

export default function LW7Releases() {
  const { isDarkMode } = useTheme()

  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)

  const [creators, setCreators] = useState<any>([])
  const [activeCreator, setActiveCreator] = useState<any>(null)

  useEffect(() => {
    if (!supabase) {
      setSupabase(
        createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
      )
    }
  }, [])

  useEffect(() => {
    if (supabase) {
      getCreators()
    }
  }, [supabase])

  useEffect(() => {
    document.body.className = isDarkMode ? 'dark bg-[#121212]' : 'light bg-[#fff]'
  }, [isDarkMode])

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
            className={`!bg-transparent !py-1 !px-4 text-transparent bg-clip-text bg-gradient-to-r from-[#2A1E6C] to-[#12121200] !border-[#6044FF20] dark:from-white dark:to-[#DFFFF1] dark:!border-[#DFFFF1] h-fit relative ${
              shipped
                ? 'after:absolute after:rounded-full text-black after:bg-white after:w-full after:h-full after:inset-0 after:bg-gradient-to-br after:from-[#FFFFFF11] after:to-[#32247E35] dark:text-transparent dark:!border-[#163837] after:dark:from-[#14292c] after:dark:to-[#141516] after:border-[#c8d8d9] after:dark:border-[#1f3536] after:-z-10 border-[#DFFFF1]'
                : ''
            }`}
          >
            {shipped ? 'Shipped' : 'Coming Soon'}
          </Badge>

          <span className="text-scale-900 text-sm">
            {day} ・ {date}
          </span>
        </div>
        <span className="text-scale-1200 text-lg mt-3 sm:mt-0">{title}</span>
      </div>
    )
  }

  const SectionButtons = ({ blog, docs, video }) => {
    return (
      <div className="flex gap-2 z-10">
        <a href={blog} target="_blank" rel="noopener">
          <div className="flex items-center border border-slate-400 bg-gradient-to-r from-[#fcfcfc] to-[#f2f2f2] hover:to-[#d5d5d5] text-black dark:text-white dark:from-[#191919] dark:to-[#464444] dark:hover:to-[#4e4e4e] rounded-full text-sm py-2 pl-3 pr-2">
            Blog post
            <div className="bg-[#eeeeee] dark:bg-[#313131] rounded-full inline-block p-1 ml-2">
              <img src="/images/launchweek/icons-blogpost.svg" className="w-4 h-4"></img>
            </div>
          </div>
        </a>
        {docs && (
          <a href={docs} target="_blank" rel="noopener">
            <div className="flex items-center border border-slate-400 bg-gradient-to-r from-[#fcfcfc] to-[#f2f2f2] hover:to-[#d5d5d5] text-black dark:text-white dark:from-[#191919] dark:to-[#464444] dark:hover:to-[#4e4e4e] rounded-full text-sm py-2 pl-3 pr-2">
              Docs
              <div className="bg-[#eeeeee] dark:bg-[#313131] rounded-full inline-block p-1 ml-2">
                <img src="/images/launchweek/icons-docs.svg" className="w-4 h-4"></img>
              </div>
            </div>
          </a>
        )}
        {video && (
          <a href={video} target="_blank" rel="noopener">
            <div className="flex items-center border border-slate-400 bg-gradient-to-r from-[#fcfcfc] to-[#f2f2f2] hover:to-[#d5d5d5] text-black dark:text-white dark:from-[#191919] dark:to-[#464444] dark:hover:to-[#4e4e4e] rounded-full text-sm py-2 pl-3 pr-2">
              Video
              <div className="bg-[#eeeeee] dark:bg-[#313131] rounded-full inline-block p-1 ml-2">
                <img src="/images/launchweek/video-icon.svg" className="w-4 h-4"></img>
              </div>
            </div>
          </a>
        )}
      </div>
    )
  }
  const [preRelease, day1, day2, day3, day4, day5] = days

  return (
    <>
      <SectionContainer className="!py-0 ">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <SmallCard>
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
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M5.55025 3.97258C5.94078 4.36311 5.94078 4.99627 5.55025 5.38679C2.81658 8.12046 2.81658 12.5526 5.55025 15.2863C5.94078 15.6768 5.94078 16.31 5.55025 16.7005C5.15973 17.091 4.52656 17.091 4.13604 16.7005C0.62132 13.1858 0.62132 7.4873 4.13604 3.97258C4.52656 3.58206 5.15973 3.58206 5.55025 3.97258ZM15.4498 3.97281C15.8403 3.58229 16.4735 3.58229 16.864 3.97281C20.3787 7.48753 20.3787 13.186 16.864 16.7007C16.4735 17.0913 15.8403 17.0913 15.4498 16.7007C15.0592 16.3102 15.0592 15.677 15.4498 15.2865C18.1834 12.5529 18.1834 8.1207 15.4498 5.38703C15.0592 4.9965 15.0592 4.36334 15.4498 3.97281ZM8.37869 6.80101C8.76921 7.19153 8.76921 7.8247 8.37869 8.21522C7.20711 9.38679 7.20711 11.2863 8.37869 12.4579C8.76921 12.8484 8.76921 13.4816 8.37868 13.8721C7.98816 14.2626 7.355 14.2626 6.96447 13.8721C5.01185 11.9195 5.01185 8.75363 6.96447 6.80101C7.355 6.41048 7.98816 6.41048 8.37869 6.80101ZM12.6213 6.80124C13.0119 6.41072 13.645 6.41072 14.0355 6.80124C15.9882 8.75386 15.9882 11.9197 14.0355 13.8723C13.645 14.2628 13.0119 14.2628 12.6213 13.8723C12.2308 13.4818 12.2308 12.8486 12.6213 12.4581C13.7929 11.2865 13.7929 9.38703 12.6213 8.21545C12.2308 7.82493 12.2308 7.19176 12.6213 6.80124ZM10.5 9.33677C11.0523 9.33677 11.5 9.78449 11.5 10.3368V10.3468C11.5 10.8991 11.0523 11.3468 10.5 11.3468C9.94772 11.3468 9.5 10.8991 9.5 10.3468V10.3368C9.5 9.78449 9.94772 9.33677 10.5 9.33677Z"
                    fill="#F2F2F2"
                  />
                </svg>
              </div>
              <div className="flex flex-col lg:flex-row ml-2 sm:ml-4">
                <span className="text-black dark:text-white mr-2">
                  Supabase + FlutterFlow Hackathon
                </span>
              </div>
            </div>
            <div className="flex gap-2 z-10">
              <Link href={'/blog/who-we-hire'} target="_blank" rel="noopener">
                <a>
                  <div className="flex items-center border border-slate-400 bg-gradient-to-r from-[#34323210] to-[#FFFFFF10] hover:to-[#d5d5d5] text-black dark:text-white dark:from-[#191919] dark:to-[#464444] dark:hover:to-[#4e4e4e] rounded-full text-sm py-2 pl-3 pr-2">
                    Blog post
                    <div className="bg-[#eeeeee] dark:bg-[#313131] rounded-full inline-block p-1 ml-2">
                      <CopySvg />
                    </div>
                  </div>
                </a>
              </Link>
            </div>
          </SmallCard>
          <SmallCard>
            <div className="relative flex items-center mb-4 sm:mb-0">
              {/* <div className="flex min-w-[20px]">
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
              </div> */}
              <div className="flex flex-col lg:flex-row">
                <span className="text-black dark:text-white mr-2">
                  SupaSpray/April fools something
                </span>
              </div>
            </div>
            <div className="flex gap-2 z-10">
              <Link href={'/blog/who-we-hire'} target="_blank" rel="noopener">
                <a>
                  <div className="flex items-center border border-slate-400 bg-gradient-to-r from-[#34323210] to-[#FFFFFF10] hover:to-[#d5d5d5] text-black dark:text-white dark:from-[#191919] dark:to-[#464444] dark:hover:to-[#4e4e4e] rounded-full text-sm py-2 pl-3 pr-2">
                    Blog post
                    <div className="bg-[#eeeeee] dark:bg-[#313131] rounded-full inline-block p-1 ml-2">
                      <CopySvg />
                    </div>
                  </div>
                </a>
              </Link>
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
          bordered={false}
          chevronAlign="right"
          defaultValue={[
            preRelease.d.toString(),
            day1.d.toString(),
            day2.d.toString(),
            day3.d.toString(),
            day4.d?.toString(),
            day5.d?.toString(),
          ]}
        >
          <div className="border-b pb-3">
            <Accordion.Item
              header={
                <AccordionHeader
                  date={preRelease.date}
                  day={preRelease.dd}
                  title={preRelease.title}
                  shipped={preRelease.shipped}
                />
              }
              disabled={!preRelease.shipped}
              className="h-[79px]"
              id={preRelease.d.toString()}
            >
              {preRelease.steps.length > 0 && (
                <div className="h-[400px] flex flex-col lg:flex-row group/preRelease relative overflow-hidden">
                  <div
                    className="absolute group-hover/preRelease:scale-105 opacity-60 group-hover/preRelease:opacity-100 w-full h-full -z-10 transition-all duration-500"
                    style={{
                      background: `radial-gradient(650px 150px at 50% 100%, ${
                        isDarkMode ? '#310C60' : '#b8e8e7'
                      }, transparent)`,
                    }}
                  ></div>
                  <div
                    className={`flex flex-col flex-1 items-center gap-5 lg:items-start lg:justify-between border rounded-xl h-full relative overflow-hidden after:opacity- after:absolute after:bg-no-repeat after:bg-[center_bottom] lg:after:bg-[right_15%_top_100px] xl:after:bg-[right_15%_top_60px] after:bg-[length:300px_180px] after:lg:bg-[length:450px_300px] after:xl:bg-[length:528px_367px] after:dark:bg-[url('/images/launchweek/docs-update-bg.png')] after:bg-[url('/images/launchweek/docs-update-bg-light.png')] after:top-0 after:right-0 after:bottom-0 after:left-0 p-14 text-2xl before:absolute before:w-full before:h-full before:top-52 before:right-0 before:bottom-0 before:left-0 before:border-[#1f3536] before:-z-10 !px-3 sm:!px-14`}
                  >
                    <div className="flex items-center relative z-10 justify-between flex-col-reverse lg:flex-row lg:justify-start gap-2 text-black dark:text-white">
                      <span>{preRelease.description}</span>
                      <Badge className="!bg-transparent h-fit lg:ml-4 text-sm !py-1 !px-4 text-transparent bg-clip-text bg-gradient-to-r from-[#99bbab] to-[#396f55] border-[#4d898c] dark:from-white dark:to-[#DFFFF1] dark:border-[#DFFFF1]">
                        Guide
                      </Badge>
                    </div>
                    <SectionButtons
                      // docs={preRelease.steps[0].docs}
                      blog={preRelease.steps[0].blog}
                      // video={'https://www.youtube.com/watch?v=Q1Amk6iDlF8&ab_channel=Supabase'}
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
                      background: `radial-gradient(650px 150px at 50% 100%, ${
                        isDarkMode ? '#310C60' : '#b8e8e7'
                      }, transparent)`,
                    }}
                  ></div>
                  <div
                    className={`flex flex-col flex-1 items-center gap-5 lg:items-start lg:justify-between border rounded-xl h-full relative overflow-hidden after:opacity- after:absolute after:bg-no-repeat after:bg-[center_bottom] lg:after:bg-[right_15%_top_100px] xl:after:bg-[right_15%_top_60px] after:bg-[length:300px_180px] after:lg:bg-[length:450px_300px] after:xl:bg-[length:528px_367px] after:dark:bg-[url('/images/launchweek/docs-update-bg.png')] after:bg-[url('/images/launchweek/docs-update-bg-light.png')] after:top-0 after:right-0 after:bottom-0 after:left-0 p-14 text-2xl before:absolute before:w-full before:h-full before:top-52 before:right-0 before:bottom-0 before:left-0 before:border-[#1f3536] before:-z-10 !px-3 sm:!px-14`}
                  >
                    <div className="flex items-center relative z-10 justify-between flex-col-reverse lg:flex-row lg:justify-start gap-2 text-black dark:text-white">
                      <span>{day1.description}</span>
                      <Badge className="!bg-transparent h-fit lg:ml-4 text-sm !py-1 !px-4 text-transparent bg-clip-text bg-gradient-to-r from-[#99bbab] to-[#396f55] border-[#4d898c] dark:from-white dark:to-[#DFFFF1] dark:border-[#DFFFF1]">
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
          <div className="border-b pb-3">
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
                    className={`relative overflow-hidden group/2 flex-1 flex flex-col items-center gap-5 lg:items-start justify-between basis-1/2 lg:basis-2/3 border rounded-xl h-full p-14 xs:text-2xl text-xl text-center bg-no-repeat bg-[url('/images/launchweek/image-processing-bg-light-alt.png')] xs:bg-[url('/images/launchweek/image-processing-bg-light.png')] dark:bg-[url('/images/launchweek/image-processing-bg-alt.png')] xs:dark:bg-[url('/images/launchweek/image-processing-bg.png')] bg-[right_30px_top_35px] lg:bg-[top_25px_right_25px] bg-contain`}
                  >
                    <div
                      className="top-0 absolute group-hover/2:scale-105 opacity-60 group-hover/2:opacity-100 w-full h-full -z-10 transition-all duration-500"
                      style={{
                        background: `radial-gradient(90% 130px at 80% 0px, ${
                          isDarkMode ? '#310C60' : '#b8e8e7'
                        }, transparent)`,
                      }}
                    ></div>
                    <div className="flex items-center lg: justify-between flex-col-reverse lg:flex-row lg:justify-start gap-2 text-black dark:text-white">
                      <div>{day2.steps[0].title}</div>
                      <Badge className="!bg-transparent h-fit lg:ml-4 text-sm !py-1 !px-4 text-transparent bg-clip-text bg-gradient-to-r from-[#99bbab] to-[#396f55] border-[#598973] dark:from-white dark:to-[#1a7a4ca1] dark:border-[#DFFFF1]">
                        New
                      </Badge>
                    </div>
                    <SectionButtons docs={day2.steps[0].docs} blog={day2.steps[0].blog} />
                  </div>
                  <div
                    className={`relative overflow-hidden group/3 flex-1 flex flex-col items-center justify-between basis-1/2 lg:basis-1/3 border rounded-xl h-full bg-no-repeat p-14 text-2xl bg-[url('/images/launchweek/cdn-caching-bg-light.png')] dark:bg-[url('/images/launchweek/cdn-caching-bg.png')] bg-[top_170px_center] lg:bg-[center_bottom] bg-contain`}
                  >
                    <div
                      className="top-0 absolute group-hover/3:scale-105 opacity-60 group-hover/3:opacity-100 w-full h-full -z-10 transition-all duration-500"
                      style={{
                        background: `radial-gradient(90% 130px at 50% 0px, ${
                          isDarkMode ? '#310C60' : '#6100FF90'
                        }, transparent)`,
                      }}
                    ></div>
                    <div className="flex flex-col items-center gap-2 min-w-[300px]">
                      <Badge className="!bg-transparent h-fit text-sm !py-1 !px-4 text-transparent bg-clip-text bg-gradient-to-r from-[#99bbab] to-[#396f55] border-[#598973] dark:from-white dark:to-[#1a7a4ca1] dark:border-[#DFFFF1]">
                        New
                      </Badge>
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
                    className={`flex flex-col text-center items-center lg:items-start justify-between flex-1 border rounded-xl h-full bg-no-repeat p-14 text-2xl relative`}
                  >
                    <div className="absolute top-0 right-0 w-full h-full -z-20 ">
                      <Image
                        src={
                          isDarkMode
                            ? '/images/launchweek/mfa-dark.png'
                            : '/images/launchweek/mfa-light.png'
                        }
                        layout="fill"
                        objectFit="cover"
                        quality={100}
                        priority
                      />
                    </div>
                    <div className="absolute top-0 right-0 w-full h-full -z-10 opacity-0 group-hover:opacity-100 duration-500 transition-all">
                      <Image
                        src={
                          isDarkMode
                            ? '/images/launchweek/mfa-dark-hover.png'
                            : '/images/launchweek/mfa-light-hover.png'
                        }
                        layout="fill"
                        objectFit="cover"
                        quality={100}
                      />
                    </div>

                    <div className="flex items-center justify-between flex-col-reverse lg:flex-row lg:justify-start text-black dark:text-white">
                      <span>{day3.steps[0].title}</span>
                      <Badge className="!bg-transparent h-fit lg:ml-4 text-sm !py-1 !px-4 text-transparent bg-clip-text bg-gradient-to-r from-[#99bbab] to-[#396f55] border-[#598973] dark:from-white dark:to-[#1a7a4ca1] dark:border-[#DFFFF1]">
                        Updated
                      </Badge>
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
                    className={`relative flex flex-col items-center justify-between lg:items-start flex-1 basis-1/2 lg:basis-2/3 border rounded-xl h-full p-14 text-2xl bg-no-repeat bg-cover !px-3 sm:!px-14`}
                  >
                    <div
                      className={`absolute top-0 right-0 w-full h-full -z-20 ${styles.wrappers}`}
                    >
                      <Image
                        src={
                          isDarkMode
                            ? '/images/launchweek/wrappers-visual.svg'
                            : '/images/launchweek/wrappers-visual-light.svg'
                        }
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
                        src={
                          isDarkMode
                            ? '/images/launchweek/wrappers-visual-hover.svg'
                            : '/images/launchweek/wrappers-visual-hover-light.svg'
                        }
                        layout="fill"
                        objectFit="cover"
                        quality={100}
                        className="test"
                      />
                    </div>
                    <div className="flex items-center flex-col-reverse lg:flex-row text-black dark:text-white">
                      <span>{day4.steps[0].title}</span>
                      <Badge className="!bg-transparent h-fit lg:ml-4 text-sm !py-1 !px-4 text-transparent bg-clip-text bg-gradient-to-r from-[#99bbab] to-[#396f55] border-[#4d898c] dark:from-white dark:to-[#1a7a4ca1] dark:border-[#DFFFF1]">
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
          <div className="border-b pb-3" id="currentDay">
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
                      className={`relative group/day5step1 flex flex-col items-center justify-between lg:items-start flex-1 basis-1/2 lg:basis-2/3 border rounded-xl h-full bg-no-repeat p-14 text-2xl overflow-hidden`}
                    >
                      <div
                        className={`absolute top-0 right-0 w-full h-full -z-20 ${styles.wrappers}`}
                      >
                        <Image
                          src={
                            isDarkMode
                              ? '/images/launchweek/vault-visual.svg'
                              : '/images/launchweek/vault-visual-light.svg'
                          }
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
                          src={
                            isDarkMode
                              ? '/images/launchweek/vault-visual-hover.svg'
                              : '/images/launchweek/vault-visual-hover-light.svg'
                          }
                          layout="fill"
                          objectFit="cover"
                          quality={100}
                          className="test"
                        />
                      </div>
                      <div className="flex items-center flex-col-reverse lg:flex-row">
                        <span className="text-black dark:text-white">{day5.steps[0].title}</span>
                        <Badge className="!bg-transparent h-fit lg:ml-4 text-sm !py-1 !px-4 text-transparent bg-clip-text bg-gradient-to-r from-[#99bbab] to-[#396f55] border-[#4d898c] dark:from-white dark:to-[#1a7a4ca1] dark:border-[#DFFFF1]">
                          New
                        </Badge>
                      </div>
                      <SectionButtons docs={day5.steps[0].docs} blog={day5.steps[0].blog} />
                    </div>
                    <div
                      className={`relative group/day5step2 flex-1 flex flex-col items-center justify-between basis-1/2 lg:basis-1/3 border rounded-xl h-full bg-no-repeat p-14 text-2xl overflow-hidden`}
                    >
                      <div className={`absolute top-0 right-0 w-full h-full -z-20`}>
                        <Image
                          src={
                            isDarkMode
                              ? '/images/launchweek/TCE-visual.svg'
                              : '/images/launchweek/TCE-visual-light.svg'
                          }
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
                          src={
                            isDarkMode
                              ? '/images/launchweek/TCE-visual-hover.svg'
                              : '/images/launchweek/TCE-visual-hover-light.svg'
                          }
                          layout="fill"
                          objectFit="cover"
                          quality={100}
                          className="test"
                        />
                      </div>
                      <div className="flex flex-col items-center gap-2 min-w-[300px]">
                        <Badge className="!bg-transparent h-fit ml-4 text-sm !py-1 !px-4 text-transparent bg-clip-text bg-gradient-to-r from-[#99bbab] to-[#396f55] border-[#4d898c] dark:from-white dark:to-[#1a7a4ca1] dark:border-[#DFFFF1]">
                          New
                        </Badge>
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
                          src={
                            isDarkMode
                              ? '/images/launchweek/community-visual.svg'
                              : '/images/launchweek/community-visual-light.svg'
                          }
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
                          src={
                            isDarkMode
                              ? '/images/launchweek/community-visual-hover.svg'
                              : '/images/launchweek/community-visual-light-hover.svg'
                          }
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
                            <div className="flex items-center border border-slate-400 bg-gradient-to-r from-[#fcfcfc] to-[#f2f2f2] hover:to-[#d5d5d5] text-black dark:text-white dark:from-[#191919] dark:to-[#464444] dark:hover:to-[#4e4e4e] rounded-full text-sm py-2 pl-3 pr-2">
                              Flutterflow
                              <div className="bg-[#eeeeee] dark:bg-[#313131] rounded-full inline-block p-1 ml-2">
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
                            <div className="flex items-center border border-slate-400 bg-gradient-to-r from-[#fcfcfc] to-[#f2f2f2] hover:to-[#d5d5d5] text-black dark:text-white dark:from-[#191919] dark:to-[#464444] dark:hover:to-[#4e4e4e] rounded-full text-sm py-2 pl-3 pr-2">
                              OneSignal
                              <div className="bg-[#eeeeee] dark:bg-[#313131] rounded-full inline-block p-1 ml-2">
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
                            <div className="flex items-center border border-slate-400 bg-gradient-to-r from-[#fcfcfc] to-[#f2f2f2] hover:to-[#d5d5d5] text-black dark:text-white dark:from-[#191919] dark:to-[#464444] dark:hover:to-[#4e4e4e] rounded-full text-sm py-2 pl-3 pr-2">
                              NextAuth
                              <div className="bg-[#eeeeee] dark:bg-[#313131] rounded-full inline-block p-1 ml-2">
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
                  <h3 className="text-black dark:text-white text-lg mb-4 mt-4">One more thing</h3>
                  <div className="flex flex-col lg:grid grid-cols-3 grid-rows-2 gap-4">
                    <div
                      className={`min-h-[400px] relative group/day5step2 flex-1 flex flex-col items-center justify-between basis-1/2 lg:basis-1/3 border rounded-xl bg-no-repeat p-14 text-2xl overflow-hidden`}
                    >
                      <div className={`absolute top-0 right-0 w-full h-full -z-20`}>
                        <Image
                          src={
                            isDarkMode
                              ? '/images/launchweek/PgGraphql-visual.svg'
                              : '/images/launchweek/PgGraphql-visual-light.svg'
                          }
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
                          src={
                            isDarkMode
                              ? '/images/launchweek/PgGraphql-visual-hover.svg'
                              : '/images/launchweek/PgGraphql-visual-hover-light.svg'
                          }
                          layout="fill"
                          objectFit="cover"
                          quality={100}
                          className="test"
                        />
                      </div>
                      <div className="flex flex-col items-center gap-2 min-w-[300px]">
                        <Badge className="!bg-transparent h-fit text-sm !py-1 !px-4 text-transparent bg-clip-text bg-gradient-to-r from-[#99bbab] to-[#396f55] border-[#4d898c] dark:from-white dark:to-[#1a7a4ca1] dark:border-[#DFFFF1]">
                          Updated
                        </Badge>
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
                          src={
                            isDarkMode
                              ? '/images/launchweek/custom-domains-visual.svg'
                              : '/images/launchweek/custom-domains-visual-light.svg'
                          }
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
                          src={
                            isDarkMode
                              ? '/images/launchweek/custom-domains-visual-hover.svg'
                              : '/images/launchweek/custom-domains-visual-hover-light.svg'
                          }
                          layout="fill"
                          objectFit="cover"
                          quality={100}
                          className="test"
                        />
                      </div>
                      <div className="flex flex-col items-center gap-2 min-w-[300px]">
                        <Badge className="!bg-transparent h-fit text-sm !py-1 !px-4 text-transparent bg-clip-text bg-gradient-to-r from-[#99bbab] to-[#396f55] border-[#4d898c] dark:from-white dark:to-[#1a7a4ca1] dark:border-[#DFFFF1]">
                          New
                        </Badge>
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
                          src={
                            isDarkMode
                              ? '/images/launchweek/PITR-visual.svg'
                              : '/images/launchweek/PITR-visual-light.svg'
                          }
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
                          src={
                            isDarkMode
                              ? '/images/launchweek/PITR-visual-hover.svg'
                              : '/images/launchweek/PITR-visual-hover-light.svg'
                          }
                          layout="fill"
                          objectFit="cover"
                          quality={100}
                          className="test"
                        />
                      </div>
                      <div className="flex flex-col items-center gap-2 min-w-[300px]">
                        <Badge className="!bg-transparent h-fit text-sm !py-1 !px-4 text-transparent bg-clip-text bg-gradient-to-r from-[#99bbab] to-[#396f55] border-[#4d898c] dark:from-white dark:to-[#1a7a4ca1] dark:border-[#DFFFF1]">
                          New
                        </Badge>
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
                          src={
                            isDarkMode
                              ? '/images/launchweek/pg_crdt-visual.svg'
                              : '/images/launchweek/pg_crdt-visual-light.svg'
                          }
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
                          src={
                            isDarkMode
                              ? '/images/launchweek/pg_crdt-visual-hover.svg'
                              : '/images/launchweek/pg_crdt-visual-hover-light.svg'
                          }
                          layout="fill"
                          objectFit="cover"
                          quality={100}
                          className="test"
                        />
                      </div>
                      <div className="flex flex-col items-center gap-2 min-w-[300px]">
                        <Badge className="!bg-transparent h-fit text-sm !py-1 !px-4 text-transparent bg-clip-text bg-gradient-to-r from-[#99bbab] to-[#396f55] border-[#4d898c] dark:from-white dark:to-[#1a7a4ca1] dark:border-[#DFFFF1]">
                          Experimental
                        </Badge>
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
                          src={
                            isDarkMode
                              ? '/images/launchweek/postgres-visual.svg'
                              : '/images/launchweek/postgres-visual-light.svg'
                          }
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
                          src={
                            isDarkMode
                              ? '/images/launchweek/postgres-visual-hover.svg'
                              : '/images/launchweek/postgres-visual-hover-light.svg'
                          }
                          layout="fill"
                          objectFit="cover"
                          quality={100}
                          className="test"
                        />
                      </div>
                      <div className="flex flex-col items-center gap-2 min-w-[300px]">
                        <Badge className="!bg-transparent h-fit text-sm !py-1 !px-4 text-transparent bg-clip-text bg-gradient-to-r from-[#99bbab] to-[#396f55] border-[#4d898c] dark:from-white dark:to-[#1a7a4ca1] dark:border-[#DFFFF1]">
                          Upgrade
                        </Badge>
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
                          src={
                            isDarkMode
                              ? '/images/launchweek/PostgREST11-visual.svg'
                              : '/images/launchweek/PostgREST11-visual-light.svg'
                          }
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
                          src={
                            isDarkMode
                              ? '/images/launchweek/PostgREST11-visual-hover.svg'
                              : '/images/launchweek/PostgREST11-visual-hover-light.svg'
                          }
                          layout="fill"
                          objectFit="cover"
                          quality={100}
                          className="test"
                        />
                      </div>
                      <div className="flex flex-col items-center gap-2 min-w-[300px]">
                        <Badge className="!bg-transparent h-fit text-sm !py-1 !px-4 text-transparent bg-clip-text bg-gradient-to-r from-[#99bbab] to-[#396f55] border-[#4d898c] dark:from-white dark:to-[#1a7a4ca1] dark:border-[#DFFFF1]">
                          Upgrade
                        </Badge>
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

      <SectionContainer className="!py-20 sm:!pb-40 sm:!pt-10"></SectionContainer>

      <SectionContainer className="!pt-0 sm:!pb-20 !pb-40"></SectionContainer>
      <SectionContainer className="!pt-0 sm:!pb-20 !pb-40">
        <div className="flex flex-col mb-16">
          <Badge
            className={`w-fit !bg-transparent !py-1 !px-4 text-transparent bg-clip-text bg-gradient-to-r from-[#99bbab] to-[#396f55] dark:from-white dark:to-[#DFFFF1] h-fit relative mb-4 after:absolute after:rounded-full text-black after:bg-white after:w-full after:h-full after:top-0 after:right-0 after:bottom-0 after:left-0 after:bg-gradient-to-br after:from-[#dceef0] after:to-[#FFFFFF] dark:text-transparent dark:!border-[#163837] after:dark:from-[#14292c] after:dark:to-[#141516] after:border-[#c8d8d9] after:dark:border-[#1f3536] after:-z-10 border-[#DFFFF1]`}
          >
            Submissions Closed
          </Badge>
          <h2 className="text-3xl text-black dark:text-white mb-2">Launch Week Hackathon</h2>
          <p className="text-slate-900 w-[80%] lg:w-[50%]">
            The traditional parallel Hackathon is back! Build a new open source project with
            Supabase and you can win $1500 in GitHub sponsorships and a coveted Supabase Darkmode
            Keyboard! For more info check the{' '}
            <a
              href="https://supabase.com/blog/launch-week-6-hackathon"
              target="_blank"
              rel="nooper noreferrer"
              className="text-brand-900"
            >
              blog post
            </a>
            .
          </p>
        </div>
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-0">
          <div className="sm:grid grid-cols-2 grid-rows-2 gap-x-4 gap-y-7 sm:gap-y-10 basis-2/3 flex flex-col">
            <div className="flex flex-col">
              <h3 className="text-lg text-black dark:text-white mb-2">Prizes</h3>
              <p className="text-slate-900 w-[90%] lg:w-[80%]">
                There are 5 categories to win, with prizes for winners and runner-ups of each
                category. Each team member gets a prize.
              </p>
            </div>
            <div className="flex flex-col">
              <h3 className="text-lg text-black dark:text-white mb-2">Judges</h3>
              <p className="text-slate-900 w-[90%] lg:w-[80%]">
                The Supabase team will judge all the categories except the Best Edge Functions
                Project, which will be judged by our friends at Deno.
              </p>
            </div>
            <div className="flex flex-col">
              <div className="flex flex-col">
                <h3 className="text-lg text-black dark:text-white mb-2">Community</h3>
                <p className="text-slate-900 w-[90%] lg:w-[80%]">
                  If you need help or advice when building, find other people to join your team, or
                  if you just want to chill and watch people build, come and join us!
                </p>
                <div></div>
                <a
                  href="https://discord.supabase.com/"
                  rel="noopener noreferrer"
                  className="text-brand-900 flex items-center"
                  target="_blank"
                >
                  Join our Discord <IconExternalLink size="small" className="inline-block ml-2" />
                </a>
              </div>
            </div>
            <div className={'flex flex-col'}>
              <h3 className="text-lg text-black dark:text-white mb-2">Submission</h3>
              <p className="text-slate-900 w-[90%] lg:w-[80%]">
                Submit your project through{' '}
                <a
                  className="text-brand-900"
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
              isDarkMode ? styles.dark_community : styles.community,
              'flex basis-1/3 flex-col px-5'
            )}
          >
            <a
              href="https://github.com/psteinroe/supabase-cache-helpers"
              target="_blank"
              rel="noopener noreferrer"
              className="self-end"
            >
              <div className="border border-slate-400 dark:border-[#2E2E2E] rounded-xl pl-5 pr-9 py-4 mb-4 bg-white dark:bg-[#121212] w-fit relative max-w-[250px]">
                <img
                  src="/images/launchweek/link.svg"
                  className="absolute top-[16px] right-[10px] text-brand-900"
                ></img>
                <h3 className="text-black dark:text-white">Supabase Cache Helpers</h3>
                <p className="text-slate-1000 text-xs">Previous Best Overall Project Winner</p>
              </div>
            </a>
            <a href="https://github.com/pheralb/superui" target="_blank" rel="noopener noreferrer">
              <div className="border border-slate-400 dark:border-[#2E2E2E] rounded-xl pl-5 pr-9 py-4 mb-4 bg-white dark:bg-[#121212] w-fit relative max-w-[250px]">
                <img
                  src="/images/launchweek/link.svg"
                  className="absolute top-[16px] right-[10px] text-brand-900"
                ></img>
                <h3 className="text-black dark:text-white">Super UI</h3>
                <p className="text-slate-1000 text-xs">Previous Best Overall Project Runner Up</p>
              </div>
            </a>
            <a
              href="https://github.com/Myzel394/quid_faciam_hodie"
              target="_blank"
              rel="noopener noreferrer"
              className="self-end"
            >
              <div className="border border-slate-400 dark:border-[#2E2E2E] rounded-xl pl-5 pr-9 py-4 mb-4 bg-white dark:bg-[#121212] w-fit relative max-w-[250px]">
                <img
                  src="/images/launchweek/link.svg"
                  className="absolute top-[16px] right-[10px] text-brand-900"
                ></img>
                <h3 className="text-black dark:text-white">Quid Faciam Hodie?</h3>
                <p className="text-slate-1000 text-xs">Winner Best Flutter Project</p>
              </div>
            </a>
            <a href="https://github.com/laznic/hotdogs" target="_blank" rel="noopener noreferrer">
              <div className="border border-slate-400 dark:border-[#2E2E2E] rounded-xl pl-5 pr-9 py-4 mb-4 bg-white dark:bg-[#121212] w-fit relative max-w-[250px]">
                <img
                  src="/images/launchweek/link.svg"
                  className="absolute top-[16px] right-[10px] text-brand-900"
                ></img>
                <h3 className="text-black dark:text-white">That Hot Dog Game</h3>
                <p className="text-slate-1000 text-xs">Previous Winner: Most Fun/Interesting</p>
              </div>
            </a>
            <a
              href="https://github.com/vvidday/repo-watch"
              target="_blank"
              rel="noopener noreferrer"
              className="self-end"
            >
              <div className="border border-slate-400 dark:border-[#2E2E2E] rounded-xl pl-5 pr-9 py-4 bg-white dark:bg-[#121212] w-fit relative max-w-[250px]">
                <img
                  src="/images/launchweek/link.svg"
                  className="absolute top-[16px] right-[10px] text-brand-900"
                ></img>
                <h3 className="text-black dark:text-white">RepoWatch</h3>
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
                  <div className="absolute -inset-0.5 bg-brand-1100 rounded-full opacity-75 group-hover:opacity-100 group-hover:blur-sm transition duration-500"></div>
                  <a href={creator.link} target="_blank" rel="noopener">
                    <img
                      className="relative rounded-full w-12 h-12 border border-brand-900 hover:shadow-md"
                      src={creator.profile_picture}
                    />
                  </a>
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex-1">
          <Badge
            className={`!bg-transparent !py-1 !px-4 text-transparent bg-clip-text bg-gradient-to-r from-[#99bbab] to-[#396f55] !border-[#4d898c] dark:from-white dark:to-[#DFFFF1] dark:!border-[#DFFFF1] h-fit relative mb-4 ${
              true
                ? 'after:absolute after:rounded-full text-black after:bg-white after:w-full after:h-full after:top-0 after:right-0 after:bottom-0 after:left-0 after:bg-gradient-to-br after:from-[#dceef0] after:to-[#FFFFFF] dark:text-transparent dark:!border-[#163837] after:dark:from-[#14292c] after:dark:to-[#141516] after:border-[#c8d8d9] after:dark:border-[#1f3536] after:-z-10 border-[#DFFFF1]'
                : ''
            }`}
          >
            Shipped
          </Badge>
          <h2 className="text-3xl dark:text-white mb-2">The Supabase Content Storm</h2>
          <p className="text-slate-900 md:max-w-[80%] mb-16">
            We worked with more than 30 content creators from around the world to drop a mountain of
            content simultaneously!
            <a rel="noopener" target="_blank" href="/blog/the-supabase-content-storm">
              <div className="text-brand-900 flex items-center mt-2">
                See all the content
                <IconExternalLink size="small" className="inline-block ml-1" />
              </div>
            </a>
          </p>
          {activeCreator !== null && (
            <div className="lg:max-w-[50%] min-h-[120px]">
              <h3 className="dark:text-white">
                {activeCreator !== null
                  ? `${creators[activeCreator].first_name} ${creators[activeCreator].last_name}`
                  : 'Title'}
              </h3>
              {activeCreator !== null && (
                <p className="text-slate-900 ">{creators[activeCreator].description}</p>
              )}
              <p className="text-brand-900 mt-1">
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
    </>
  )
}
