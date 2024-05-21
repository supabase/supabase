import { useState, useEffect } from 'react'
import { SupabaseClient } from '@supabase/supabase-js'
import { useRouter } from 'next/router'
import { SITE_ORIGIN } from '~/lib/constants'
import { Button } from 'ui'
import { CheckCircle } from 'lucide-react'

import useConfData from '~/components/LaunchWeek/hooks/use-conf-data'

type FormState = 'default' | 'loading' | 'error'

export default function TicketForm() {
  const [formState, setFormState] = useState<FormState>('default')
  const [realtimeChannel, setRealtimeChannel] = useState<ReturnType<
    SupabaseClient['channel']
  > | null>(null)
  const [errorMsg] = useState('')
  const { supabase, session, setUserData, setTicketState, userData } = useConfData()
  const router = useRouter()

  // Triggered on session
  async function fetchUser() {
    if (supabase && session?.user && !userData.id) {
      const username = session.user.user_metadata.user_name
      const name = session.user.user_metadata.full_name
      const email = session.user.email

      await supabase
        .from('lw11_tickets')
        .insert({
          email,
          name,
          username,
          referred_by: router.query?.referral ?? null,
        })
        .eq('email', email)
        .select()
        .single()
        .then(async ({ error }: any) => {
          // If error because of duplicate email, ignore and proceed, otherwise sign out.
          if (error && error?.code !== '23505') {
            setFormState('error')
            return supabase.auth.signOut()
          }
          const { data } = await supabase
            .from('lw11_tickets_platinum')
            .select('*')
            .eq('username', username)
            .single()
          if (data) {
            setUserData(data)
          }

          setFormState('default')

          // Prefetch GitHub avatar
          new Image().src = `https://github.com/${username}.png`

          // Prefetch the twitter share URL to eagerly generate the page
          fetch(`/launch-week/tickets/${username}`).catch((_) => {})

          if (!realtimeChannel) {
            const channel = supabase
              .channel('changes')
              .on(
                'postgres_changes',
                {
                  event: 'UPDATE',
                  schema: 'public',
                  table: 'lw11_tickets',
                  filter: `username=eq.${username}`,
                },
                (payload: any) => {
                  const platinum = !!payload.new.sharedOnTwitter && !!payload.new.sharedOnLinkedIn
                  const secret = !!payload.new.gameWonAt
                  setUserData({
                    ...payload.new,
                    platinum,
                    secret,
                  })
                }
              )
              .subscribe()
            setRealtimeChannel(channel)
          }
        })
    }
  }

  useEffect(() => {
    fetchUser()

    return () => {
      // Cleanup realtime subscription on unmount
      realtimeChannel?.unsubscribe()
    }
  }, [session])

  async function handleGithubSignIn() {
    if (formState !== 'default') {
      setFormState('default')
      return
    }

    setFormState('loading')
    setTicketState('loading')

    const redirectTo = `${SITE_ORIGIN}/ga-week/${
      userData.username ? '?referral=' + userData.username : ''
    }`

    supabase?.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo,
      },
    })
  }

  return formState === 'error' ? (
    <div className="">
      <div>{errorMsg}</div>
      <Button
        type="secondary"
        onClick={() => {
          setFormState('default')
          setTicketState('registration')
        }}
      >
        Try Again
      </Button>
    </div>
  ) : (
    <div className="flex flex-col gap-10 items-start justify-center relative z-20">
      <Button
        size="tiny"
        type="alternative"
        disabled={formState === 'loading' || Boolean(session)}
        onClick={handleGithubSignIn}
        iconLeft={session && <CheckCircle />}
        loading={formState === 'loading'}
        className="px-4 h-auto !py-1.5"
      >
        Claim your ticket
      </Button>
    </div>
  )
}
