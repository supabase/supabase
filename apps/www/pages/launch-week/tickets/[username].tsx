import { useEffect, useState } from 'react'
import { NextSeo } from 'next-seo'
import { GetStaticProps, GetStaticPaths } from 'next'
import Image from 'next/image'
import Error from 'next/error'
import dynamic from 'next/dynamic'
import { Session, SupabaseClient, createClient } from '@supabase/supabase-js'
import { useTheme } from 'next-themes'

import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import TicketContainer from '~/components/LaunchWeek/X/Ticket/TicketContainer'
import { SITE_URL } from '~/lib/constants'
import { TicketState, ConfDataContext, UserData } from '~/components/LaunchWeek/hooks/use-conf-data'
import supabase from '../../../lib/supabaseMisc'

const LWXTicketContainer = dynamic(() => import('~/components/LaunchWeek/X/Ticket/TicketContainer'))
const LaunchWeekPrizeSection = dynamic(
  () => import('~/components/LaunchWeek/X/LaunchWeekPrizeSection')
)
const TicketBrickWall = dynamic(() => import('~/components/LaunchWeek/X/TicketBrickWall'))
const CTABanner = dynamic(() => import('~/components/CTABanner'))

interface Props {
  user: UserData
  users: UserData[]
  ogImageUrl: string
}

export default function UsernamePage({ user, users, ogImageUrl }: Props) {
  const { username, ticketNumber, name } = user

  const TITLE = `${name ? name + '’s' : 'Get your'} #SupaLaunchWeek Ticket`
  const DESCRIPTION =
    'Supabase Launch Week X | 11-15 December 2023 | Generate your ticket & win awesome swag.'
  const OG_URL = `${SITE_URL}/tickets/${username}`

  const [session, setSession] = useState<Session | null>(null)
  const { resolvedTheme, setTheme } = useTheme()
  const [initialDarkMode] = useState(resolvedTheme?.includes('dark'))

  const [ticketState, setTicketState] = useState<TicketState>('ticket')

  if (!ticketNumber) {
    return <Error statusCode={404} />
  }

  useEffect(() => {
    document.body.classList.add('bg-[#020405]')

    return () => {
      if (document.body.classList.contains('bg-[#020405]')) {
        document.body.classList.remove('bg-[#020405]')
      }
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
      <ConfDataContext.Provider
        value={{
          supabase,
          session,
          userData: user,
          setUserData: () => null,
          ticketState,
          setTicketState,
        }}
      >
        <DefaultLayout>
          <div className="-mt-[65px]">
            <div className="relative">
              <div className="relative z-10">
                <SectionContainer className="relative z-10 flex flex-col justify-around items-center gap-2 lg:!pb-0 md:gap-4 !px-2 !mx-auto md:min-h-[auto]">
                  <div className="w-full min-h-[400px] pt-24 flex items-center">
                    <LWXTicketContainer supabase={supabase} />
                  </div>
                </SectionContainer>
              </div>
            </div>
            {/* {users && <TicketBrickWall users={users.slice(0, 17)} />} */}
          </div>
          <CTABanner className="!bg-[#020405] border-t-0" />
        </DefaultLayout>
      </ConfDataContext.Provider>
    </>
  )
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const username = params?.username?.toString() || null
  let user

  // fetch users for the TicketBrickWall
  const { data: users } = await supabase!.from('lwx_tickets_golden').select().limit(17)

  fetch(
    `https://obuldanrptloktxcffvn.supabase.co/functions/v1/lwx-ticket?username=${encodeURIComponent(
      username ?? ''
    )}`
  ).catch((_) => {})

  // fetch a specific user
  if (username) {
    const { data } = await supabase!
      .from('lwx_tickets_golden')
      .select('name, username, ticketNumber, metadata, golden')
      .eq('username', username)
      .single()

    user = data
  }

  const BUCKET_FOLDER_VERSION = 'v1'

  const ogImageUrl = `https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/lwx/og/${
    user?.golden ? 'golden' : 'regular'
  }/${BUCKET_FOLDER_VERSION}/${username}.png`

  return {
    props: {
      user: {
        ...user,
        username,
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
