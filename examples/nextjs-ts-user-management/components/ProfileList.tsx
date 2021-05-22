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
  type?: string
  payload: any
}
type ProfileListProps = {
  profiles: Profile[]
}

const handleDatabaseEvent = (state: State, action: Action) => {
  if (action.type === 'upsert') {
    const otherProfiles = state.profiles.filter((x) => x.id != action.payload.id)
    return {
      profiles: [action.payload, ...otherProfiles],
    }
  } else if (action.type === 'set') {
    return {
      profiles: action.payload,
    }
  }
  return { profiles: [] }
}

export default function ProfileList({ profiles }: ProfileListProps) {
  const initialState: State = { profiles }
  const [state, dispatch] = useReducer(handleDatabaseEvent, initialState)

  useEffect(() => {
    const subscription = supabase
      .from('profiles')
      .on('*', (payload) => {
        dispatch({ type: 'upsert', payload: payload.new })
      })
      .subscribe()

    return () => {
      supabase.removeSubscription(subscription)
    }
  }, [])

  useEffect(() => {
    dispatch({ type: 'set', payload: profiles })
  }, [profiles])

  return (
    <>
      {state.profiles.length === 0 ? (
        <p className="opacity-half font-light m-0">There are no public profiles created yet</p>
      ) : (
        <div className="profileList">
          {state.profiles?.map((profile: any) => (
            <ProfileCard profile={profile} key={profile.id} />
          ))}
        </div>
      )}
    </>
  )
}
