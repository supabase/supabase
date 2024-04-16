import { useEffect, useState } from 'react'
import { NextSeo } from 'next-seo'
import { GetStaticProps, GetStaticPaths } from 'next'
import Link from 'next/link'
import Error from 'next/error'
import dynamic from 'next/dynamic'
import { Session } from '@supabase/supabase-js'
import { Button } from 'ui'
import { SITE_URL, SPECIAL_ANNOUNCEMENT_URL } from '~/lib/constants'
import supabase from '~/lib/supabaseMisc'
import supabaseMiscAdmin from '~/lib/supabaseMiscAdmin'
import dayjs from 'dayjs'

import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { TicketState, ConfDataContext, UserData } from '~/components/LaunchWeek/hooks/use-conf-data'
import LW11Background from '~/components/LaunchWeek/11/LW11Background'
import { useTheme } from 'next-themes'

const LW11TicketContainer = dynamic(
  () => import('~/components/LaunchWeek/11/Ticket/TicketContainer')
)
const LaunchWeekPrizeSection = dynamic(
  () => import('~/components/LaunchWeek/11/LaunchWeekPrizeSection')
)
const CTABanner = dynamic(() => import('~/components/CTABanner'))

interface Props {
  user: UserData
  users: UserData[]
  ogImageUrl: string
}

export default function UsernamePage({ user, ogImageUrl }: Props) {
  const { username, ticketNumber, name } = user

  const DISPLAY_NAME = name || username
  const TITLE = `${DISPLAY_NAME ? DISPLAY_NAME.split(' ')[0] + '’s' : 'Get your'} ticket`
  const DESCRIPTION = ``
  const PAGE_URL = `${SPECIAL_ANNOUNCEMENT_URL}/tickets/${username}`

  const [session] = useState<Session | null>(null)
  const [ticketState, setTicketState] = useState<TicketState>('ticket')
  const { resolvedTheme, setTheme } = useTheme()

  const isDark = resolvedTheme?.includes('dark')
  const isDarkTheme = resolvedTheme === 'dark'

  useEffect(() => {
    isDarkTheme && setTheme('deep-dark')
  }, [isDarkTheme])

  useEffect(() => {
    return () => {
      isDark && setTheme('dark')
    }
  }, [])

  if (!ticketNumber) {
    return <Error statusCode={404} />
  }

  return (
    <>
      <NextSeo
        title={TITLE}
        openGraph={{
          title: TITLE,
          description: DESCRIPTION,
          url: PAGE_URL,
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
        <DefaultLayout className="bg-alternative">
          <div className="relative -mt-[65px] overflow-hidden">
            <SectionContainer className="relative !pt-8 lg:!pt-10 z-10 flex flex-col xl:flex-row items-center xl:justify-center xl:items-center gap-8 md:gap-10 xl:gap-20 text-foreground text-center md:text-left">
              <div className="w-auto min-h-[400px] pt-24 flex items-center">
                <LW11TicketContainer />
              </div>
              <div className="flex flex-col items-center justify-center xl:justify-start xl:items-start gap-4 text-foreground text-center md:text-left max-w-sm">
                <h1 className="text-2xl">{DISPLAY_NAME?.split(' ')[0]}'s Ticket</h1>
                <span className="text-foreground-lighter mb-2">
                  Join @{username} for a Special Announcement and create your ticket for a chance to
                  win swag.
                </span>
                <Button type="alternative" asChild>
                  <Link href={`${SITE_URL}${username ? '?referral=' + username : ''}`}>
                    Claim your ticket
                  </Link>
                </Button>
              </div>
            </SectionContainer>
            <LW11Background className="absolute z-0 top-0 left-0 right-0 w-full flex items-center justify-center opacity-20" />
          </div>
          <SectionContainer className="!pt-4 !pb-0">
            <LaunchWeekPrizeSection />
          </SectionContainer>
          <CTABanner className="!bg-alternative border-t-0" />
        </DefaultLayout>
      </ConfDataContext.Provider>
    </>
  )
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const username = params?.username?.toString() || null
  let user

  fetch(
    `https://obuldanrptloktxcffvn.supabase.co/functions/v1/lw11-og?username=${encodeURIComponent(
      username ?? ''
    )}`
  )

  // fetch a specific user
  if (username) {
    const { data } = await supabaseMiscAdmin!
      .from('lw11_tickets_platinum')
      .select('name, username, ticketNumber, metadata, platinum, secret')
      .eq('username', username)
      .single()

    user = data
  }

  const ticketType = user?.secret ? 'secret' : user?.platinum ? 'platinum' : 'regular'
  const ogImageUrl = `https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/lw11/og/${ticketType}/${username}.png?t=${dayjs(new Date()).format('DHHmmss')}`

  return {
    props: {
      user: {
        ...user,
        username,
      },
      ogImageUrl,
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
