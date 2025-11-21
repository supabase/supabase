import { useCallback, useEffect, useRef } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'

import useConfData, { type UserTicketData } from './use-conf-data'
import { LW15_URL } from 'lib/constants'
import supabase from '../supabase'
import { BG_COLORS, TYPO_COLORS } from '../Ticketing/colors'
import { fetchGitHubUser } from '../utils/github-api'

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

interface RegistrationProps {
  onRegister?: () => void
  onError?: (error: any) => void
}

export const useRegistration = ({ onError, onRegister }: RegistrationProps = {}) => {
  const [
    { userTicketData: userData, session, userTicketDataState, urlParamsLoaded, referal },
    dispatch,
  ] = useConfData()
  const sessionUser = session?.user
  const callbacksRef = useRef({ onError, onRegister })

  // Triggered on session
  const fetchOrCreateUser = useCallback(async () => {
    if (['loading', 'loaded'].includes(userTicketDataState)) return
    if (!urlParamsLoaded) return

    if (!sessionUser) {
      console.warn('Cannot fetch user without session. Skipping...')
      return
    }

    const username = sessionUser.user_metadata?.user_name as string | undefined
    const name = sessionUser.user_metadata.full_name
    const email = sessionUser.email
    const userId = sessionUser.id
    const defaultColors = {
      background: BG_COLORS[0],
      foreground: TYPO_COLORS[0],
    }

    if (!username) {
      throw new Error('Username is required')
    }

    if (!userData.id) {
      dispatch({ type: 'USER_TICKET_FETCH_STARTED' })

      // Fetch GitHub user data
      let githubUserData = null
      try {
        githubUserData = await fetchGitHubUser(username)
      } catch (error) {
        console.warn('Failed to fetch GitHub user data:', error)
      }

      const metadata = {
        colors: defaultColors,
        ...(githubUserData && {
          company: githubUserData.company,
          location: githubUserData.location,
        }),
      }

      const { error: ticketInsertError } = await supabase
        .from('tickets')
        .insert({
          user_id: userId,
          launch_week: 'lw15',
          email,
          name,
          username,
          referred_by: referal ?? null,
          metadata,
        })
        .select()
        .single()

      // If error because of duplicate email, ignore and proceed, otherwise sign out.
      if (ticketInsertError && ticketInsertError?.code !== '23505') {
        dispatch({ type: 'USER_TICKET_FETCH_ERROR', payload: ticketInsertError })
        callbacksRef.current.onError?.(ticketInsertError)
        return supabase.auth.signOut()
      }

      const { data, error: ticketsViewError } = await supabase
        .from('tickets_view')
        .select('*')
        .eq('launch_week', 'lw15')
        .eq('username', username)
        .single()

      if (ticketsViewError) {
        dispatch({ type: 'USER_TICKET_FETCH_ERROR', payload: ticketsViewError })
        callbacksRef.current.onError?.(ticketsViewError)
        return
      }

      dispatch({ type: 'USER_TICKET_FETCH_SUCCESS', payload: data })

      await prefetchData(username)
    }

    callbacksRef.current.onRegister?.()
  }, [dispatch, referal, sessionUser, urlParamsLoaded, userData.id, userTicketDataState])

  async function prefetchData(username: string) {
    // Prefetch GitHub avatar
    // new Image().src = `https://github.com/${username}.png`

    // Prefetch the twitter share URL to eagerly generate the page
    await fetch(`/api-v2/ticket-og?username=${username}`)
  }

  const handleGithubSignIn = useCallback(async () => {
    let redirectTo = `${LW15_URL}/ticket`

    if (referal) {
      redirectTo += `?referal=${referal}`
    }

    const response = await supabase?.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo,
      },
    })

    if (response) {
      if (response.error) {
        callbacksRef.current?.onError?.(response.error)
        return
      }
    }
  }, [referal])

  useEffect(() => {
    fetchOrCreateUser()

    const username = sessionUser?.user_metadata?.user_name as string | undefined

    if (username) {
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

      return () => {
        // Cleanup realtime subscription on unmount
        channel?.unsubscribe()
      }
    }
  }, [dispatch, fetchOrCreateUser, sessionUser?.user_metadata?.user_name])

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) console.error('Session error', error)
      dispatch({ type: 'SESSION_UPDATED', payload: data.session })
      dispatch({ type: 'SESSION_LOADED' })
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      dispatch({ type: 'SESSION_UPDATED', payload: session })

      if (session && window.location.hash.includes('access_token')) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
      }
    })

    return () => subscription.unsubscribe()
  }, [dispatch])

  useEffect(() => {
    callbacksRef.current = { onError, onRegister }
  })

  const upgradeTicket = async () => {
    if (userData.id) {
      if (userData.secret) {
        // console.log('User already has a secret ticket')
        return
      }

      const { error } = await supabase
        .from('tickets')
        .update({ game_won_at: new Date() })
        .eq('launch_week', 'lw15')
        .eq('username', userData.username)

      if (error) {
        return console.error('Failed to upgrade user ticket', error)
      }

      // Trigger og-image ticket generation
      await fetch(`/api-v2/ticket-og?username=${userData.username}`)
    } else {
      console.warn('Cannot upgrade ticket without user data')
    }
  }

  return {
    signIn: handleGithubSignIn,
    upgradeTicket,
  }
}

// Update ticket colors in the database
export async function updateTicketColors({
  username,
  userMetadata,
  background,
  foreground,
}: {
  username: string
  userMetadata: UserTicketData['metadata']
  background: string
  foreground: string
}) {
  const githubUserData = await fetchGitHubUser(username)
  const { error } = await supabase
    .from('tickets')
    .update({
      metadata: {
        ...userMetadata,
        ...(githubUserData && {
          company: githubUserData.company,
          location: githubUserData.location,
        }),
        colors: {
          background,
          foreground,
        },
      },
    })
    .eq('launch_week', 'lw15')
    .eq('username', username)

  if (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to update ticket colors', error)
    throw error
  }
}
