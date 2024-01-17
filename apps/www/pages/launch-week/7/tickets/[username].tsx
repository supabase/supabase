import { NextSeo } from 'next-seo'
import { GetStaticProps, GetStaticPaths } from 'next'
import Error from 'next/error'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import TicketContainer from '~/components/LaunchWeek/7/Ticket/TicketContainer'
import { SITE_URL, SAMPLE_TICKET_NUMBER } from '~/lib/constants'
import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { IconArrowDown } from 'ui'
import LaunchWeekPrizeSection from '~/components/LaunchWeek/7/LaunchWeekPrizeSection'
import { LaunchWeekLogoHeader } from '~/components/LaunchWeek/7/LaunchSection/LaunchWeekLogoHeader'
import TicketBrickWall from '~/components/LaunchWeek/7/LaunchSection/TicketBrickWall'
import { UserData } from '~/components/LaunchWeek/hooks/use-conf-data'
import LW7BgGraphic from '~/components/LaunchWeek/7/LW7BgGraphic'
import CTABanner from '~/components/CTABanner'
import { useTheme } from 'next-themes'

interface Props {
  user: UserData
  users: UserData[]
  ogImageUrl: string
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_MISC_USE_URL ?? 'http://localhost:54321',
  process.env.NEXT_PUBLIC_MISC_USE_ANON_KEY!
)

export default function UsernamePage({ user, users, ogImageUrl }: Props) {
  const { resolvedTheme } = useTheme()
  const { username, ticketNumber, name, golden, referrals, bg_image_id } = user
  const TITLE = `${name ? name + '’s' : 'Get your'} #SupaLaunchWeek Ticket`
  const DESCRIPTION = 'Supabase Launch Week 7 | 10–14 April 2023 | Generate your ticket. Win swag.'
  const OG_URL = `${SITE_URL}/tickets/${username}`

  const [supabase] = useState(() =>
    createClient(process.env.NEXT_PUBLIC_MISC_USE_URL!, process.env.NEXT_PUBLIC_MISC_USE_ANON_KEY!)
  )

  if (!ticketNumber) {
    return <Error statusCode={404} />
  }

  useEffect(() => {
    document.body.className = '!dark bg-[#1C1C1C]'

    return () => {
      document.body.className = resolvedTheme?.includes('dark') ? 'dark' : 'light'
    }
  }, [])

  return (
    <>
      <NextSeo
        title={TITLE}
        openGraph={{
          title: TITLE,
          description: DESCRIPTION,
          url: OG_URL,
          images: [
            {
              url: ogImageUrl,
              width: 1200,
              height: 630,
            },
          ],
        }}
      />
      <DefaultLayout>
        <div className="bg-[#1C1C1C] -mt-[65px]">
          <div className="relative bg-lw7 pt-20">
            <div className="relative z-10">
              <SectionContainer className="flex flex-col justify-around items-center !py-4 md:!py-8 gap-2 md:gap-4 !px-2 !mx-auto xl:h-[calc(90vh-65px)] min-h-[600px] md:min-h-[auto] lg:min-h-[650px]">
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
  let ogImageUrl

  // fetch users for the TicketBrickWall
  const { data: users } = await supabaseAdmin!.from('lw7_tickets_golden').select().limit(17)

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
    ogImageUrl = `https://obuldanrptloktxcffvn.supabase.co/functions/v1/lw7-ticket-og?username=${encodeURIComponent(
      username ?? ''
    )}${golden ? '&golden=true' : ''}`
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
      ogImageUrl,
      users,
      key: username,
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
