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

const days = _days as WeekDayProps[]

export default function launchweek() {
  const { isDarkMode } = useTheme()

  // TODO: update days json
  const shippingHasStarted = false
  const title = 'Launch Week 6'
  const description = 'Supabase Launch Week 6 | 12-18 Dec 2022'

  const [supabase] = useState(() =>
    createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  )
  const [session, setSession] = useState<Session | null>(null)
  // const description = 'Supabase Launch Week 6 | 12-16 Dec 2022'
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
              url: `https://supabase.com/images/launchweek/launch-week-6.jpg`,
            },
          ],
        }}
      />
      <DefaultLayout>
        <SectionContainer className="flex flex-col !pb-24 items-center lg:pt-32 gap-32">
          <div className="flex flex-col gap-3">
            <img
              src="/images/launchweek/launchweek-logo--light.svg"
              className="w-40 dark:hidden lg:w-80"
            />
            <img
              src="/images/launchweek/launchweek-logo--dark.svg"
              className="hidden w-40 dark:block lg:w-80"
            />
            <p className="text-scale-1100 text-sm text-center">Dec 12 – 16 at 8 AM PT | 11 AM ET</p>
          </div>
          <TicketContainer
            supabase={supabase}
            session={session}
            defaultUserData={defaultUserData}
            defaultPageState={query.ticketNumber ? 'ticket' : 'registration'}
          />
        </SectionContainer>
        <div className="gradient-container">
          <div className="gradient-mask"></div>
          <div className="gradient-mask--masked bottom-of-the-circle"></div>

          <div className="flair-mask-a the-stroke-of-the-circle"></div>
          <div className="flair-mask-b inside-the-circle"></div>
        </div>
        {/* <div>
          <div className="flex justify-between pt-80 mx-6 md:mx-16 lg:mx-40 overflow-hidden"> */}
        {/* <div className="flex-1 relative overflow-hidden radial-mask">
              <div className="orbit absolute top-[75%]">
                <span className="planet1"></span>
                <span className="planet2"></span>
                <span className="planet3"></span>
                <span className="planet4"></span>
              </div>
            </div>
            <div className="flex flex-col flex-1">
              <Badge
                color="brand"
                size="large"
                className="text-center flex justify-center mb-6 w-40 bg-gradient-to-r from-white to-mint-900  "
              >
                <p className="flex items-center gap-2 p-1 text-white dark:text-black">
                  Currently happening
                </p>
              </Badge>
              <h2 className="text-scale-1200 text-5xl mb-6">See creators using Supabase</h2>
              <p className="text-scale-900 text-base md:max-w-xl mb-16">
                Description about Content Storm, something to tie it up with Launch Week
              </p>

              <h3 className="text-scale-1200 text-lg mb-2">Coding Garden</h3>
              <p className="text-scale-1000 text-base md:max-w-[60%] mb-2">
                If needed this is a short description about the type of content this is linking to.
              </p>
              <div className="flex items-center">
                <a href="www.google.com" className="text-bas text-brand-1100 mr-3">
                  Livestreaming Typescript
                </a>{' '}
                <div className="w-4 text-brand-1100 -rotate-45">
                  <ArrowRightIcon />
                </div>
              </div>
            </div> */}
        {/* <div className="dark:bg-scale-300 flex flex-col gap-4 overflow-hidden rounded-md border bg-white shadow-sm md:max-w-lg">
              <div className="flex flex-col gap-3 p-10 pb-0">
                <h3 className="text-scale-1200 text-lg">You can still win a lucky gold ticket</h3>
                <p className="text-scale-1100 text-sm">
                  A few of the lucky attendees for Launch Week will get a limited edition Supabase
                  goodie bag.
                </p>
              </div>
              <div className="px-10"></div>
              <img src="/images/launchweek/gold-ticket.svg" className="w-full" />
            </div> */}
        {/* </div>
        </div> */}
        {/* <SectionContainer
          className={[
            'grid flex-col gap-24 lg:gap-16',
            !shippingHasStarted && 'lg:grid-cols-2 ',
          ].join(' ')}
        >
          {!shippingHasStarted && <ScheduleInfo />}
          <div>
            {days.map((item: WeekDayProps, i) => {
              return (
                <LaunchSection
                  key={'launchweek-item ' + (item.title || i)}
                  {...item}
                  index={i}
                  shippingHasStarted={shippingHasStarted}
                />
              )
            })}
          </div>
        </SectionContainer>
        <SectionContainer>
          <HackathonSection />
        </SectionContainer> */}
      </DefaultLayout>
    </>
  )
}
