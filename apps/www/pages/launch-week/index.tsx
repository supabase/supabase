import { NextSeo } from 'next-seo'
import _days from '~/components/LaunchWeek/days.json'
import { WeekDayProps } from '~/components/LaunchWeek/types'
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

import styles from './launchWeek.module.css'

const days = _days as WeekDayProps[]

import { Badge } from '~/../../packages/ui'
import Avatar from '~/components/Avatar'

// TODO
// check rss
// change content storm content on hover/click
// images on orbit
const constellation = [
  [10, 10],
  [13, 27],
  [50, 15],
  [80, 28],
  [8, 58],
  [32, 38],
  [30, 79],
  [63, 75],
  [82, 55],
  [45, 62],
  [20, 64],
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
      console.log('get data')
      let supa = await supabase.from('lw6_creators').select()

      let { data, error, status } = supa

      if (error && status !== 406) {
        throw error
      }

      if (data) {
        console.log(supa)
        setCreators(data)
      }
    } catch (error) {
      // alert('Error loading user data!')
      console.log(error)
    } finally {
      // setLoading(false)
    }
  }

  console.log({ creators })
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
        <SectionContainer className="flex flex-col !pb-24 items-center lg:pt-32 gap-32">
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
        <SectionContainer className="flex gap-6 min-h-[350px] !py-3">
          <div
            className={`flex-1 bg-[url('/images/launchweek/orbit.svg')] bg-contain bg-no-repeat  bg-bottom relative`} //grid grid-cols-5 grid-rows-5
          >
            {creators.map((creator: any, index: number) => {
              return (
                <div
                  className={`justify-self-center absolute`}
                  onClick={() => {
                    'wat'
                  }}
                  onMouseEnter={() => {
                    console.log(creators[activeCreator])
                    setActiveCreator(index)
                  }}
                  style={{
                    top: `${constellation[index][0]}%`,
                    left: `${constellation[index][1]}%`,
                  }}
                >
                  <a href={creator.link} target="_blank">
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-brand-600 rounded-full group-hover:blur-md"></div>
                      <img
                        className="relative rounded-full w-12 h-12 border border-brand-900 hover:shadow-md"
                        src={creator.profile_picture}
                      />
                    </div>
                  </a>
                </div>
              )
            })}
          </div>
          <div className="flex-1">
            <Badge className="mb-6">Currently happening</Badge>
            <h2 className="text-5xl dark:text-white mb-6">See creators using Supabase</h2>
            <p className="text-slate-900 max-w-[80%] mb-16">
              Description about Content Storm, something to tie it up with Launch Week. To find
              learn more info about creators check our{' '}
              <span className="text-brand-900">
                <a rel="noopener" target="_blank" href="/blog">
                  blog post.
                </a>
              </span>
            </p>
            <div className="lg:max-w-[50%]">
              <h3 className="dark:text-white">
                {activeCreator !== null ? `${creators[activeCreator].first_name}` : 'Dummy tytle'}
              </h3>
              <p className="dark:text-slate-900">
                If needed this is a short description about the type of content this is linking to.
              </p>
              <p className="text-brand-900">
                <a rel="noopener" target="_blank" href="/blog">
                  Livestreaming Now
                </a>
              </p>
            </div>
          </div>
        </SectionContainer>
      </DefaultLayout>
    </>
  )
}
