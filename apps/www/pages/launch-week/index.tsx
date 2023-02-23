import { NextSeo } from 'next-seo'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import TicketContainer from '~/components/LaunchWeek/Ticket/TicketContainer'
import { SITE_URL } from '~/lib/constants'
import { useRouter } from 'next/router'
import { createClient, Session, SupabaseClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'
import { useTheme } from 'ui'
import classNames from 'classnames'
import styles from './launchWeek.module.css'
import styleUtils from '~/components/LaunchWeek/Ticket/utils.module.css'
import Image from 'next/image'

export default function TicketHome() {
  const { isDarkMode } = useTheme()

  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const description = 'Supabase Launch Week 7 | 3-7 April 2023'
  const { query, pathname } = useRouter()
  const isLauchWeekPage = pathname.includes('launch-week')
  const ticketNumber = query.ticketNumber?.toString()

  const defaultUserData = {
    id: query.id?.toString(),
    ticketNumber: ticketNumber ? parseInt(ticketNumber, 10) : undefined,
    name: query.name?.toString(),
    username: query.username?.toString(),
  }

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
      supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        setSession(session)
      })

      return () => subscription.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    document.body.className = isDarkMode ? 'dark bg-[#121212]' : 'light bg-[#fff]'
  }, [isDarkMode])

  return (
    <>
      <NextSeo
        title={`Get your #SupaLaunchWeek Ticket`}
        openGraph={{
          title: `Get your #SupaLaunchWeek Ticket`,
          description: description,
          url: `${SITE_URL}/tickets`,
          images: [
            {
              url: `https://supabase.com/images/launchweek/og-image.jpg`, // TODO
            },
          ],
        }}
      />
      <DefaultLayout>
        <div className={`${styles['bg-lw7']} -mt-16 pt-12`}>
          <SectionContainer className="flex flex-col !pb-1 items-center lg:pt-32 gap-24">
            <div className="flex flex-col gap-3 items-center justify-center xl:justify-start">
              <div
                className={classNames(
                  styleUtils.appear,
                  styleUtils['appear-first'],
                  'flex flex-col justify-center gap-3'
                )}
              >
                <h1 className="flex gap-[24px] justify-center font-normal uppercase text-[32px] items-center">
                  <span className="tracking-[4px] text-white">Launch week</span>
                  <span className="flex justify-center">
                    <Image src="/images/launchweek/seven/lw7-seven.svg" width={40} height={40} />
                  </span>
                </h1>
                <p className="text-white text-sm text-center">
                  April 3rd – 7th at 6 AM PT | 9 AM ET
                </p>
              </div>
            </div>
            {supabase && (
              <TicketContainer
                supabase={supabase}
                session={session}
                defaultUserData={defaultUserData}
                defaultPageState="ticket"
              />
            )}
          </SectionContainer>
        </div>
      </DefaultLayout>
    </>
  )
}
