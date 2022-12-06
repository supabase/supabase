import { NextSeo } from 'next-seo'
import _days from '~/components/LaunchWeek/days.json'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'

import { createClient, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import TicketContainer from '~/components/LaunchWeek/Ticket/TicketContainer'
import { useTheme } from '~/components/Providers'
import classNames from 'classnames'
import styleUtils from '~/components/LaunchWeek/Ticket/utils.module.css'
import { SITE_ORIGIN } from '~/lib/constants'

import { Badge, IconExternalLink } from '~/../../packages/ui'

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
  const { isDarkMode } = useTheme()

  const title = 'Launch Week 6'
  const description = 'Supabase Launch Week 6 | 12-18 Dec 2022'

  const [supabase] = useState(() =>
    createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  )
  const [session, setSession] = useState<Session | null>(null)
  const [creators, setCreators] = useState<any>([])
  const [activeCreator, setActiveCreator] = useState<any>(null)
  const { query } = useRouter()
  const ticketNumber = query.ticketNumber?.toString()
  const defaultUserData = {
    id: query.id?.toString(),
    ticketNumber: ticketNumber ? parseInt(ticketNumber, 10) : undefined,
    name: query.name?.toString(),
    username: query.username?.toString(),
  }

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
    })

    getCreators()
  }, [])

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
        <SectionContainer className="flex flex-col !pb-1 items-center lg:pt-32 gap-32">
          <div
            className={classNames(
              styleUtils.appear,
              styleUtils['appear-first'],
              'flex flex-col justify-center gap-3'
            )}
          >
            <div className="flex justify-center">
              <img
                src="/images/launchweek/launchweek-logo--light.svg"
                className="flex w-40 dark:hidden lg:w-80"
              />
              <img
                src="/images/launchweek/launchweek-logo--dark.svg"
                className="hidden w-40 dark:flex lg:w-80"
              />
            </div>
            <p className="text-scale-1100 text-sm text-center">Dec 12 – 16 at 8 AM PT | 11 AM ET</p>
          </div>
          <div className={classNames(styleUtils.appear, styleUtils['appear-second'])}>
            <TicketContainer
              supabase={supabase}
              session={session}
              defaultUserData={defaultUserData}
              defaultPageState={query.ticketNumber ? 'ticket' : 'registration'}
            />
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
        <SectionContainer
          className={classNames(
            'flex gap-6 min-h-[350px] !py-3 mb-11 flex-col-reverse md:flex-row',
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
            <Badge className="mb-6 bg-gradient-to-r from-[#0E3737C2] to-[#67947F] hover:to-[#39617D94] dark:hover:to-[#A6FFD899] text-whiteA-1200 dark:text-black font-normal !py-1 !px-4 dark:from-white dark:via-white dark:to-[#1a7a4c75] bg-slate-1200">
              Currently happening
            </Badge>
            <h2 className="text-4xl dark:text-white mb-2">The Supabase Content Storm</h2>
            <p className="text-slate-900 md:max-w-[80%] mb-16">
              We worked with +30 content creators from around the world to drop a mountain of
              content simultaneously!
              <a rel="noopener" target="_blank" href="/blog/the-supabase-content-storm">
                <div className="text-brand-900 flex items-center">
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
                <p className="text-brand-900">
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
