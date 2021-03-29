import ProfileCard from '../components/ProfileCard'
import { Profile } from '../lib/constants'
import { supabase } from '../lib/supabaseClient'
import { useEffect, useReducer } from 'react'

/**
 * Since we want this component to update in realtime,
 * we should use "useReducer" for sending Realtime events
 */

type State = {
  profiles: Profile[]
}
type Action = {
  payload: Profile
}
type ProfileListProps = {
  profiles: Profile[]
}

const handleDatabaseEvent = (state: State, action: Action) => {
  const otherProfiles = state.profiles.filter((x) => x.id != action.payload.id)
  return {
    profiles: [action.payload, ...otherProfiles],
  }
}

export default function ProfileList({ profiles }: ProfileListProps) {
  const initialState: State = { profiles }
  const [state, dispatch] = useReducer(handleDatabaseEvent, initialState)

  useEffect(() => {
    const subscription = supabase
      .from('profiles')
      .on('*', (payload) => {
        dispatch({ payload: payload.new })
      })
      .subscribe()

    return () => {
      supabase.removeSubscription(subscription)
    }
  }, [])

  return (
    <>
      {state.profiles?.map((profile) => (
        <ProfileCard profile={profile} key={profile.id} />
      ))}
    </>
  )
}
