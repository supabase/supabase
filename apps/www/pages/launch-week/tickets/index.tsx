import { NextSeo } from 'next-seo'
import { GetStaticProps, GetStaticPaths } from 'next'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import TicketContainer from '~/components/LaunchWeek/Ticket/TicketContainer'
import { SITE_URL, SAMPLE_TICKET_NUMBER } from '~/lib/constants'
import { useRouter } from 'next/router'
import { createClient, Session, SupabaseClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'
import { useTheme } from 'common/Providers'
import { UserData } from '~/components/LaunchWeek/Ticket/hooks/use-conf-data'
import TicketBrickWall from '~/components/LaunchWeek/LaunchSection/TicketBrickWall'

interface Props {
  users: UserData[]
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321',
  process.env.SUPABASE_SERVICE_ROLE_SECRET ??
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9idWxkYW5ycHRsb2t0eGNmZnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Njk3MjcwMTIsImV4cCI6MTk4NTMwMzAxMn0.SZLqryz_-stF8dgzeVXmzZWPOqdOrBwqJROlFES8v3I'
)

export default function TicketHome({ users }: Props) {
  const { isDarkMode } = useTheme()

  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const description = 'Supabase Launch Week 6 | 12-16 Dec 2022'
  const { query } = useRouter()
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
        <SectionContainer className="flex flex-col gap-16">
          <div className="flex flex-col gap-3 items-center justify-center xl:justify-start">
            <img
              src="/images/launchweek/launchweek-logo--light.svg"
              className="flex w-40 dark:hidden lg:w-80"
            />
            <img
              src="/images/launchweek/launchweek-logo--dark.svg"
              className="hidden w-40 dark:flex lg:w-80"
            />
            <p className="text-scale-1100 text-sm">Dec 12 – 16 at 8 AM PT | 11 AM ET</p>
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
        {users && <TicketBrickWall users={users} />}
      </DefaultLayout>
    </>
  )
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  // fetch users for the TicketBrickWall
  const { data: users } = await supabaseAdmin!.from('lw7_tickets').select().limit(8)

  return {
    props: {
      users,
    },
    revalidate: 5,
  }
}

export const getStaticPaths: GetStaticPaths = async () => {
  return Promise.resolve({
    paths: [],
    fallback: 'blocking',
  })
}
