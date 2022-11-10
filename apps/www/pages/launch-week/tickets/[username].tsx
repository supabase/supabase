import { NextSeo } from 'next-seo'
import { GetStaticProps, GetStaticPaths } from 'next'
import Error from 'next/error'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import Ticket from '~/components/LaunchWeek/Ticket/ticket'
import {
  PageState,
  ConfDataContext,
  UserData,
} from '~/components/LaunchWeek/Ticket/hooks/use-conf-data'
import { SITE_URL, SAMPLE_TICKET_NUMBER } from '~/lib/constants'
import { useState } from 'react'

type Props = {
  username: string | null
  name: string | null
  ticketNumber: number | null
  golden: boolean
}

export default function TicketShare({ username, ticketNumber, name, golden }: Props) {
  const description = 'Supabase Launch Week 6 | 12-16 Dec 2022'
  const [userData, setUserData] = useState<UserData>({ username, ticketNumber, name, golden })
  const [pageState, setPageState] = useState<PageState>(ticketNumber ? 'ticket' : 'registration')

  if (!ticketNumber) {
    return <Error statusCode={404} />
  }

  return (
    <ConfDataContext.Provider
      value={{
        userData,
        setUserData,
        setPageState,
      }}
    >
      <NextSeo
        title={`${name}’s #SupaLaunchWeek Ticket`}
        openGraph={{
          title: `${name}’s #SupaLaunchWeek Ticket`,
          description: description,
          url: `${SITE_URL}/tickets/${username}`,
          images: [
            {
              url: `https://supabase.com/images/launchweek/og-image.jpg`, // TODO
            },
          ],
        }}
      />
      <div className="launch-week-gradientBg"></div>
      <DefaultLayout>
        <SectionContainer className="flex flex-col gap-8 !pb-0 md:gap-16 lg:gap-16">
          <img
            src="/images/launchweek/launchweek-logo--light.svg"
            className="md:40 w-28 dark:hidden lg:w-48"
          />
          <img
            src="/images/launchweek/launchweek-logo--dark.svg"
            className="md:40 hidden w-28 dark:block lg:w-48"
          />
          <Ticket
            username={username}
            name={name}
            ticketNumber={ticketNumber}
            sharePage={true}
            golden={golden}
          />
        </SectionContainer>
      </DefaultLayout>
    </ConfDataContext.Provider>
  )
}

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const username = params?.username?.toString() || null
  let name: string | null | undefined
  let ticketNumber: number | null | undefined
  const GOLDEN_TICKETS = (process.env.GOLDEN_TICKETS?.split(',') ?? []).map((n) => Number(n))

  if (username) {
    // const user = await getUserByUsername(username)
    // name = user.name ?? user.username
    // ticketNumber = user.ticketNumber
  }
  return {
    props: {
      username: ticketNumber ? username : null,
      usernameFromParams: username || null,
      name: ticketNumber ? name || username || null : null,
      ticketNumber: ticketNumber || SAMPLE_TICKET_NUMBER,
      golden: GOLDEN_TICKETS.includes(ticketNumber ?? SAMPLE_TICKET_NUMBER),
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
