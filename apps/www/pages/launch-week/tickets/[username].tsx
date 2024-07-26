import { useState } from 'react'
import { GetStaticProps, GetStaticPaths } from 'next'
import dayjs from 'dayjs'
import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Error from 'next/error'
import { createClient, Session } from '@supabase/supabase-js'
import { Button } from 'ui'
import { SITE_URL, LW_URL } from '~/lib/constants'
import supabase from '~/lib/supabase'
import { Database } from '~/lib/database.types'

import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { TicketState, ConfDataContext, UserData } from '~/components/LaunchWeek/hooks/use-conf-data'
import LW12Background from '~/components/LaunchWeek/12/LW12Background'

const LW12TicketContainer = dynamic(
  () => import('~/components/LaunchWeek/12/Ticket/TicketContainer')
)
const CTABanner = dynamic(() => import('~/components/CTABanner'))

interface Props {
  user: UserData
  users: UserData[]
  ogImageUrl: string
}

export default function UsernamePage({ user, ogImageUrl }: Props) {
  const { username, ticket_number: ticketNumber, name } = user

  const DISPLAY_NAME = name || username
  const FIRST_NAME = DISPLAY_NAME?.split(' ')[0]
  const TITLE = `${DISPLAY_NAME ? DISPLAY_NAME.split(' ')[0] + '’s' : 'Get your'} LW12 ticket`
  const DESCRIPTION = `Claim your Supabase Launch Week 12 ticket for a chance to win supa swag.`
  const PAGE_URL = `${LW_URL}/tickets/${username}`

  const [session] = useState<Session | null>(null)
  const [ticketState, setTicketState] = useState<TicketState>('ticket')

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
                <LW12TicketContainer />
              </div>
              <div className="flex flex-col items-center justify-center xl:justify-start xl:items-start gap-4 text-foreground text-center md:text-left max-w-sm">
                <h1 className="text-2xl">{DISPLAY_NAME?.split(' ')[0]}'s Ticket</h1>
                <span className="text-foreground-lighter mb-2">
                  Join {FIRST_NAME} on Supabase Launch Week 12 and claim your ticket for a chance to
                  win supa swag.
                </span>
                <Button type="alternative" asChild>
                  <Link href={`${SITE_URL}${username ? '?referral=' + username : ''}`}>
                    Claim your ticket
                  </Link>
                </Button>
              </div>
            </SectionContainer>
            <LW12Background className="absolute z-0 top-0 left-0 right-0 w-full flex items-center justify-center opacity-20" />
          </div>
          <CTABanner className="!bg-alternative border-t-0" />
        </DefaultLayout>
      </ConfDataContext.Provider>
    </>
  )
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const username = params?.username?.toString() || null
  let user

  const supabaseAdmin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.LIVE_SUPABASE_COM_SERVICE_ROLE_KEY!
  )

  fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/lw12-ticket-og?username=${encodeURIComponent(
      username ?? ''
    )}`
  )

  // fetch a specific user
  if (username) {
    const { data } = await supabaseAdmin!
      .from('tickets_view')
      .select('name, username, ticket_number, metadata, platinum, secret, role, company, location')
      .eq('launch_week', 'lw12')
      .eq('username', username)
      .single()

    user = data
  }

  const ticketType = user?.secret ? 'secret' : user?.platinum ? 'platinum' : 'regular'
  const ogImageUrl = `https://deulbcctwgmwupazcfmd.supabase.co/storage/v1/object/public/images/launch-week/lw12/og/${ticketType}/${username}.png?t=${dayjs(new Date()).format('DHHmmss')}`

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
