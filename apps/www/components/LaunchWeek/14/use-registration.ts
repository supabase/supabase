import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { SupabaseClient } from '@supabase/supabase-js'
import { useRouter } from 'next/router'

import useConfData from '~/components/LaunchWeek/hooks/use-conf-data'
import { LW14_URL } from '~/lib/constants'

interface RegistrationProps {
  onRegister?: () => void
  onError?: (error: any) => void
}

type FormState = 'default' | 'loading' | 'error'

export const useRegistration = (props: RegistrationProps) => {
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
        console.log("Inserting ticket", userId)
        setTicketState('loading')
        const { error } = await supabase
          .from('tickets')
          .insert({
            user_id: userId,
            launch_week: 'lw14',
            email,
            name,
            username,
            metadata: { theme: resolvedTheme },
            referred_by: router.query?.referral ?? null,
          })
          .select()
          .single()

        if(error) {
          console.error("Error inserting ticket", error)
        }

        await fetchUser({ error, username })
      }

      props.onRegister?.()
    }
  }

  const fetchUser = async ({ error, username }: any) => {
    if (!supabase) return

    // If error because of duplicate email, ignore and proceed, otherwise sign out.
    if (error && error?.code !== '23505') {
      setFormState('error')
      props.onError?.(error)
      return supabase.auth.signOut()
    }

    console.log('Fetching user...')

    const { data } = await supabase
      .from('tickets_view')
      .select('*')
      .eq('launch_week', 'lw14')
      .eq('username', username)
      .single()
      .throwOnError()

    console.log('Fetched user', data)

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
            console.log('Ticket changes', payload)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  async function handleGithubSignIn() {
    if (formState !== 'default') {
      setFormState('default')
      return
    }

    setFormState('loading')
    setTicketState('loading')

    const redirectTo = `${LW14_URL}${userData.username ? '?referral=' + userData.username : ''}`

    const response = await supabase?.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo,
      },
    })

    if (response) {
      if (response.error) {
        setFormState('error')
        props.onError?.(response.error)
        return
      }
    }
  }

  return {
    formState,
    realtimeChannel,
    signIn: handleGithubSignIn,
  }
}
