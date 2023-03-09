import { NextSeo } from 'next-seo'
import { GetStaticProps, GetStaticPaths } from 'next'
import Error from 'next/error'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import TicketContainer from '~/components/LaunchWeek/Ticket/TicketContainer'
import { SITE_URL, SAMPLE_TICKET_NUMBER } from '~/lib/constants'
import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { IconArrowDown } from 'ui'
import LaunchWeekPrizeSection from '~/components/LaunchWeek/LaunchSection/LaunchWeekPrizeSection'
import { LaunchWeekLogoHeader } from '~/components/LaunchWeek/LaunchSection/LaunchWeekLogoHeader'
import TicketBrickWall from '~/components/LaunchWeek/LaunchSection/TicketBrickWall'
import { UserData } from '~/components/LaunchWeek/Ticket/hooks/use-conf-data'
import LW7BgGraphic from '../../../components/LaunchWeek/LW7BgGraphic'
import CTABanner from '../../../components/CTABanner'

interface Props {
  user: UserData
  users: UserData[]
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321',
  process.env.SUPABASE_SERVICE_ROLE_SECRET ??
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_SECRET ??
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9idWxkYW5ycHRsb2t0eGNmZnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Njk3MjcwMTIsImV4cCI6MTk4NTMwMzAxMn0.SZLqryz_-stF8dgzeVXmzZWPOqdOrBwqJROlFES8v3I'
)

export default function TicketShare({ user, users }: Props) {
  const { username, ticketNumber, name, golden, referrals, bg_image_id } = user

  const [supabase] = useState(() =>
    createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  )
  const description = 'Supabase Launch Week 6 | 12-16 Dec 2022'

  if (!ticketNumber) {
    return <Error statusCode={404} />
  }

  const ogImageUrl = `https://obuldanrptloktxcffvn.functions.supabase.co/lw7-ticket-og?username=${encodeURIComponent(
    username ?? ''
  )}${golden ? '&golden=true' : ''}`

  useEffect(() => {
    document.body.className = 'dark bg-[#1C1C1C]'
  }, [])

  return (
    <>
      <NextSeo
        title={`${name ? name + '’s' : 'Get your'} #SupaLaunchWeek Ticket`}
        openGraph={{
          title: `${name ? name + '’s' : 'Get your'} #SupaLaunchWeek Ticket`,
          description: description,
          url: `${SITE_URL}/tickets/${username}`,
          images: [
            {
              url: ogImageUrl,
            },
          ],
        }}
      />
      <DefaultLayout>
        <div className="bg-[#1C1C1C] -mt-20">
          <div className="relative bg-lw7 pt-20">
            <div className="relative z-10">
              <SectionContainer className="flex flex-col justify-between items-center !pb-16 gap-16">
                <LaunchWeekLogoHeader />
                <TicketContainer
                  supabase={supabase}
                  session={null}
                  defaultUserData={{
                    username: username || undefined,
                    name: name || '',
                    ticketNumber,
                    golden,
                    referrals,
                    bg_image_id,
                  }}
                  sharePage
                />
                <div>
                  <a href="#lw-7-prizes" className="flex items-center text-white text-sm gap-4">
                    See the prizes{' '}
                    <span className="bounce-loop">
                      <IconArrowDown w={10} h={12} />
                    </span>
                  </a>
                </div>
              </SectionContainer>
              <LW7BgGraphic />
            </div>
            <div className={['bg-lw7-gradient absolute inset-0 z-0', golden && 'gold'].join(' ')} />
          </div>
          <LaunchWeekPrizeSection className="-mt-20 md:-mt-60" />
          <TicketBrickWall users={users} />
        </div>
        <CTABanner />
      </DefaultLayout>
    </>
  )
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const username = params?.username?.toString() || null
  let name: string | null | undefined
  let ticketNumber: number | null | undefined
  let golden = false
  let referrals = 0
  let bg_image_id

  // fetch users for the TicketBrickWall
  const { data: users } = await supabaseAdmin!.from('lw7_tickets_golden').select().limit(12)

  // fetch a specific user
  if (username) {
    const { data: user } = await supabaseAdmin!
      .from('lw7_tickets_golden')
      .select('name, ticketNumber, golden, referrals, bg_image_id')
      .eq('username', username)
      .single()
    name = user?.name
    ticketNumber = user?.ticketNumber
    golden = user?.golden ?? false
    bg_image_id = user?.bg_image_id ?? 1
    referrals = user?.referrals ?? 0
  }

  return {
    props: {
      user: {
        username: ticketNumber ? username : null,
        usernameFromParams: username || null,
        name: ticketNumber ? name || username || null : null,
        ticketNumber: ticketNumber || SAMPLE_TICKET_NUMBER,
        golden,
        referrals,
        bg_image_id,
      },
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
