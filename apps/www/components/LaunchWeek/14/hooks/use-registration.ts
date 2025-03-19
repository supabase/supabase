import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { REALTIME_CHANNEL_STATES, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'
import { useRouter } from 'next/router'

import useConfData from './use-conf-data'
import { LW14_URL } from '~/lib/constants'
import supabase from '../supabase'

interface RegistrationProps {
  onRegister?: () => void
  onError?: (error: any) => void
}

export const useRegistration = (props?: RegistrationProps) => {
  const { resolvedTheme } = useTheme()
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null)
  const [{ userTicketData: userData, session, userTicketDataState }, dispatch] = useConfData()
  const router = useRouter()

  // Triggered on session
  const fetchOrCreateUser = async () => {
    if (['loading', 'loaded'].includes(userTicketDataState)) return

    if (!session?.user) {
      console.warn('Cannot fetch user without session. Skipping...')
      return
    }

    const username = session.user.user_metadata?.user_name as string | undefined
    const name = session.user.user_metadata.full_name
    const email = session.user.email
    const userId = session.user.id

    if (!username) {
      throw new Error('Username is required')
    }

    if (!userData.id) {
      dispatch({ type: 'USER_TICKET_FETCH_STARTED' })

      const { error: ticketInsertError } = await supabase
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

      // If error because of duplicate email, ignore and proceed, otherwise sign out.
      if (ticketInsertError && ticketInsertError?.code !== '23505') {
        dispatch({ type: 'USER_TICKET_FETCH_ERROR', payload: ticketInsertError })
        props?.onError?.(ticketInsertError)
        return supabase.auth.signOut()
      }

      const { data, error: ticketsViewError } = await supabase
        .from('tickets_view')
        .select('*')
        .eq('launch_week', 'lw14')
        .eq('username', username)
        .single()

      if (ticketsViewError) {
        dispatch({ type: 'USER_TICKET_FETCH_ERROR', payload: ticketsViewError })
        props?.onError?.(ticketsViewError)
        return
      }

      dispatch({ type: 'USER_TICKET_FETCH_SUCCESS', payload: data })

      await prefetchData(username)

      if (!realtimeChannel || realtimeChannel.state === REALTIME_CHANNEL_STATES.closed) {
        const channel = subscribeToTicketChanges(username, (payload) => {
          const platinum = !!payload.new.shared_on_twitter && !!payload.new.shared_on_linkedin
          const secret = !!payload.new.game_won_at
          dispatch({
            type: 'USER_TICKET_UPDATED',
            payload: {
              ...payload.new,
              platinum,
              secret,
            },
          })
        })
        setRealtimeChannel(channel)
      }
    }

    props?.onRegister?.()
  }

  async function prefetchData(username: string) {
    // Prefetch GitHub avatar
    // new Image().src = `https://github.com/${username}.png`

    // Prefetch the twitter share URL to eagerly generate the page
    await fetch(`/api-v2/ticket-og?username=${username}`)
  }

  function subscribeToTicketChanges(
    username: string,
    onChange: (payload: any) => void
  ): RealtimeChannel {
    return supabase
      .channel('changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tickets',
          filter: `username=eq.${username}`,
        },
        onChange
      )
      .subscribe()
  }

  async function handleGithubSignIn() {
    const redirectTo = `${LW14_URL}${userData.username ? '?referral=' + userData.username : ''}`

    const response = await supabase?.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo,
      },
    })

    if (response) {
      if (response.error) {
        props?.onError?.(response.error)
        return
      }
    }
  }

  useEffect(() => {
    if (!session) {
      return
    }

    fetchOrCreateUser()

    return () => {
      // Cleanup realtime subscription on unmount
      realtimeChannel?.unsubscribe()
    }
  }, [session])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      dispatch({ type: 'SESSION_UPDATED', payload: data.session })
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      dispatch({ type: 'SESSION_UPDATED', payload: session })
    })

    return () => subscription.unsubscribe()
  }, [dispatch])

  const upgradeTicket = async () => {
    if (userData.id) {
      if(userData.secret) {
        console.log('User already has a secret ticket')
        return 
      }

      const { error } = await supabase
        .from('tickets')
        .update({ game_won_at: new Date() })
        .eq('launch_week', 'lw14')
        .eq('username', userData.username)

      if (error) {
        return console.error('Failed to upgrade user ticket', error)
      }

      // Trigger og-image ticket generation
      await fetch(`/api-v2/ticket-og?username=${userData.username}&secret=true`)

    } else {
      console.warn('Cannot upgrade ticket without user data')
    }
  }

  return {
    realtimeChannel,
    signIn: handleGithubSignIn,
    upgradeTicket,
  }
}
