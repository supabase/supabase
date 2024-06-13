import { useEffect, useState } from 'react'
import { NextSeo } from 'next-seo'
import { GetStaticProps, GetStaticPaths } from 'next'
import Link from 'next/link'
import Error from 'next/error'
import dynamic from 'next/dynamic'
import { useTheme } from 'next-themes'
import { Session } from '@supabase/supabase-js'
import { Button } from 'ui'
import { SITE_URL } from '~/lib/constants'
import supabase from '~/lib/supabaseMisc'

import FaviconImports from '~/components/LaunchWeek/X/FaviconImports'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { TicketState, ConfDataContext, UserData } from '~/components/LaunchWeek/hooks/use-conf-data'
import LWXBackground from '~/components/LaunchWeek/X/LWXBackground'

const LWXTicketContainer = dynamic(() => import('~/components/LaunchWeek/X/Ticket/TicketContainer'))
const LaunchWeekPrizeSection = dynamic(
  () => import('~/components/LaunchWeek/X/LaunchWeekPrizeSection')
)
const CTABanner = dynamic(() => import('~/components/CTABanner'))

interface Props {
  user: UserData
  users: UserData[]
  ogImageUrl: string
}

export default function UsernamePage({ user, ogImageUrl }: Props) {
  const { username, ticketNumber, name } = user

  const TITLE = `${name ? name + '’s' : 'Get your'} #SupaLaunchWeek Ticket`
  const DESCRIPTION = `Claim and share your Supabase Launch Week X ticket for a chance to win Supabase swag.`
  const OG_URL = `${SITE_URL}/x/tickets/${username}`

  const [session, setSession] = useState<Session | null>(null)
  const { resolvedTheme, setTheme } = useTheme()
  const [initialDarkMode] = useState(resolvedTheme?.includes('dark'))

  const [ticketState, setTicketState] = useState<TicketState>('ticket')

  if (!ticketNumber) {
    return <Error statusCode={404} />
  }

  useEffect(() => {
    document.body.classList.add('bg-[#060809]')

    return () => {
      if (document.body.classList.contains('bg-[#060809]')) {
        document.body.classList.remove('bg-[#060809]')
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
      <FaviconImports />
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
            <SectionContainer className="relative z-10 flex flex-col justify-around items-center gap-2 md:gap-10 !px-2 !mx-auto md:min-h-[auto]">
              <div className="w-full min-h-[400px] pt-24 flex items-center">
                <LWXTicketContainer />
              </div>
              <div className="flex flex-col items-center justify-center text-center gap-2 max-w-lg">
                <h1 className="text-2xl">
                  {name}'s
                  <br />
                  Launch Week X Ticket
                </h1>
              </div>
              <Button type="secondary" asChild>
                <Link href={`${SITE_URL}/x`}>Go to Launch Week X</Link>
              </Button>
            </SectionContainer>
            <LWXBackground className="absolute z-0 top-0 left-0 right-0 w-full flex items-center justify-center opacity-20" />
          </div>
          <SectionContainer className="!pt-4 !pb-0">
            <LaunchWeekPrizeSection />
          </SectionContainer>
          <CTABanner className="!bg-[#060809] border-t-0" />
        </DefaultLayout>
      </ConfDataContext.Provider>
    </>
  )
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const username = params?.username?.toString() || null
  let user

  fetch(
    `https://obuldanrptloktxcffvn.supabase.co/functions/v1/lwx-og?username=${encodeURIComponent(
      username ?? ''
    )}`
  )
  fetch(
    `https://obuldanrptloktxcffvn.supabase.co/functions/v1/lwx-ticket?username=${encodeURIComponent(
      username ?? ''
    )}`
  )

  // fetch a specific user
  if (username) {
    const { data } = await supabase!
      .from('lwx_tickets_golden')
      .select('name, username, ticketNumber, metadata, golden')
      .eq('username', username)
      .single()

    user = data
  }

  // @ts-ignore
  const ticketType = user?.metadata?.hasSecretTicket
    ? 'secret'
    : user?.golden
      ? 'platinum'
      : 'regular'

  const ogImageUrl = `https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/lwx/og/${ticketType}/${username}.png`

  return {
    props: {
      user: {
        ...user,
        username,
      },
      ogImageUrl,
      key: username,
    },
    // revalidate: 5,
  }
}

export const getStaticPaths: GetStaticPaths = async () => {
  return Promise.resolve({
    paths: [],
    fallback: 'blocking',
  })
}
