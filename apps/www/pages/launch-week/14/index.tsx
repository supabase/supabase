import { NextSeo } from 'next-seo'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { TicketState, ConfDataContext, UserData } from '~/components/LaunchWeek/hooks/use-conf-data'
import { LW14_DATE, LW14_TITLE, LW14_URL, SITE_ORIGIN } from '~/lib/constants'
import supabase from '~/lib/supabase'
import { LwView } from '~/components/LaunchWeek/14/LwView'

const Lw14Page = () => {
  const { query } = useRouter()

  const TITLE = `${LW14_TITLE} | ${LW14_DATE}`
  const DESCRIPTION = 'Join us for a week of announcing new features, every day at 7 AM PT.'
  const OG_IMAGE = `${SITE_ORIGIN}/images/launchweek/14/lw14-og.png?lw=14`

  const ticketNumber = query.ticketNumber?.toString()
  const [session, setSession] = useState<Session | null>(null)
  const [showCustomizationForm, setShowCustomizationForm] = useState<boolean>(false)

  const defaultUserData = {
    id: query.id?.toString(),
    ticket_number: ticketNumber ? parseInt(ticketNumber, 10) : undefined,
    name: query.name?.toString(),
    username: query.username?.toString(),
    platinum: !!query.platinum,
  }

  const [userData, setUserData] = useState<UserData>(defaultUserData)
  const [ticketState, setTicketState] = useState<TicketState>('registration')

  useEffect(() => {
    if (supabase) {
      console.log("Calling getSession")
      supabase.auth.getSession().then(({ data, error }) => { 
        console.log("Setting session", data, error)
        setSession(data.session)
      })
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session)
      })

      return () => subscription.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    if (session?.user) {
      if (userData?.id) {
        return setTicketState('ticket')
      }
      return setTicketState('loading')
    }
    if (!session) return setTicketState('registration')
  }, [session, userData])

  console.log({userData})
  return (
    <>
      <NextSeo
        title={TITLE}
        description={DESCRIPTION}
        openGraph={{
          title: TITLE,
          description: DESCRIPTION,
          url: LW14_URL,
          images: [
            {
              url: OG_IMAGE,
            },
          ],
        }}
      />

      <ConfDataContext.Provider
        value={{
          supabase,
          session,
          userData,
          setUserData,
          ticketState,
          setTicketState,
          showCustomizationForm,
          setShowCustomizationForm,
        }}
      >
        <LwView/>
      </ConfDataContext.Provider>
    </>
  )
}

export default Lw14Page
