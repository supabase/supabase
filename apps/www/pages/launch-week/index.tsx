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

export default function launchweek() {
  const { isDarkMode } = useTheme()

  const title = 'Launch Week 6'
  const description = 'Supabase Launch Week 6 | 12-18 Dec 2022'

  const [supabase] = useState(() =>
    createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  )
  const [session, setSession] = useState<Session | null>(null)
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
  }, [])

  useEffect(() => {
    document.body.className = isDarkMode ? 'dark bg-[#121212]' : 'light bg-[#fff]'
  }, [isDarkMode])

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
            className={`flex-1 bg-[url('/images/launchweek/orbit.svg')] bg-contain bg-no-repeat ${styles.mask} grid grid-cols-5 bg-bottom`}
          >
            <Avatar img="shane-rice.png" caption="Shane" />
            <Avatar img="shane-rice.png" caption="Shane" />
            <Avatar img="shane-rice.png" caption="Shane" />
            <Avatar img="shane-rice.png" caption="Shane" />
            <Avatar img="shane-rice.png" caption="Shane" />
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
              <h3 className="dark:text-white">Selected User PlaceHolder</h3>
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
