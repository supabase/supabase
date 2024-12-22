import { useState, useEffect } from 'react'
import { SupabaseClient } from '@supabase/supabase-js'
import { useRouter } from 'next/router'
import { SITE_ORIGIN } from '~/lib/constants'
import { Button } from 'ui'
import { useKey } from 'react-use'

import { useCommandMenuOpen } from 'ui-patterns'
import useConfData from '~/components/LaunchWeek/hooks/use-conf-data'
import { useTheme } from 'next-themes'

type FormState = 'default' | 'loading' | 'error'

export default function TicketForm() {
  const { resolvedTheme } = useTheme()
  const [formState, setFormState] = useState<FormState>('default')
  const [realtimeChannel, setRealtimeChannel] = useState<ReturnType<
    SupabaseClient['channel']
  > | null>(null)
  const [errorMsg] = useState('')
  const { supabase, session, setUserData, setTicketState, userData } = useConfData()
  const router = useRouter()

  // Triggered on session
  async function fetchOrCreateUser() {
    if (supabase && session?.user && !userData.id) {
      const username = session.user.user_metadata.user_name
      const name = session.user.user_metadata.full_name
      const email = session.user.email
      const userId = session.user.id

      if (!userData.id) {
        await supabase
          .from('tickets')
          .insert({
            user_id: userId,
            launch_week: 'lw13',
            email,
            name,
            username,
            metadata: { theme: resolvedTheme },
            referred_by: router.query?.referral ?? null,
          })
          .select()
          .single()
          .then(({ data, error }: any) => {
            console.log(data, error, username, userData)
            fetchUser({ error, username })
          })
      }
    }
  }

  const fetchUser = async ({ error, username }: any) => {
    if (!supabase) return

    // If error because of duplicate email, ignore and proceed, otherwise sign out.
    if (error && error?.code !== '23505') {
      setFormState('error')
      return supabase.auth.signOut()
    }

    const { data } = await supabase
      .from('tickets_view')
      .select('*')
      .eq('launch_week', 'lw13')
      .eq('username', username)
      .single()
      .throwOnError()

    if (data) setUserData(data)

    setFormState('default')

    // Prefetch GitHub avatar
    new Image().src = `https://github.com/${username}.png`

    // Prefetch the twitter share URL to eagerly generate the page
    // fetch(`/launch-week/tickets/${username}?came_from_signup=true`).catch((_) => {})
    await fetch(`/api-v2/ticket-og?username=${username}`)

    if (!realtimeChannel) {
      const channel = supabase
        .channel('changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'tickets',
            filter: `username=eq.${username}`,
          },
          (payload: any) => {
            const platinum = !!payload.new.shared_on_twitter && !!payload.new.shared_on_linkedin
            const secret = !!payload.new.game_won_at
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
  }

  useEffect(() => {
    fetchOrCreateUser()

    return () => {
      // Cleanup realtime subscription on unmount
      realtimeChannel?.unsubscribe()
    }
  }, [session])

  const isCommandMenuOpen = useCommandMenuOpen()
  useKey('t', () => !isCommandMenuOpen && handleGithubSignIn(), {}, [isCommandMenuOpen])

  async function handleGithubSignIn() {
    if (formState !== 'default') {
      setFormState('default')
      return
    }

    setFormState('loading')
    setTicketState('loading')

    const redirectTo = `${SITE_ORIGIN}/launch-week/${
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
    <div className="flex flex-col gap-10 items-start justify-center relative z-20 pointer-events-auto">
      <Button
        size="small"
        disabled={formState === 'loading' || Boolean(session)}
        onClick={handleGithubSignIn}
        loading={formState === 'loading'}
        type="default"
        className="sm:pl-1"
      >
        <div className="flex items-center">
          <div className="relative h-6 w-6 border rounded bg-surface-75 mr-2 uppercase hidden sm:flex items-center justify-center">
            T
          </div>
          Claim Ticket
        </div>
      </Button>
    </div>
  )
}
