import type { NextPage } from 'next'
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react'

import { useEffect, useState } from 'react'

import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { withPageAuth } from '@supabase/auth-helpers-nextjs'
import { RealtimePresenceState } from '@supabase/supabase-js'

const HomePage: NextPage = () => {
  const supabaseClient = useSupabaseClient()
  const this_user = useUser()
  const [userState, setUserState] = useState<RealtimePresenceState>({})
  //const channel = useRef<RealtimeChannel>();

  useEffect(() => {
    console.log('user : ', this_user);

    
    const channel = supabaseClient.channel('online-users', {
      config: {
        presence: {
          key: this_user?.email ? this_user?.email : 'Unknown',
        },
      },
    })

    channel.on('presence', { event: 'sync' }, () => {
      const presentState = channel.presenceState()

      console.log(' inside presence ', presentState)

      setUserState({...presentState});

    })

    channel.on('presence', { event: 'join' }, ({ newPresences }) => {
      console.log('New users have joined: ', newPresences)
    })

    channel.subscribe(
      async (status) => {
      if (status === 'SUBSCRIBED') {
        const status = await channel.track({
          user_name: this_user?.email ? this_user?.email : 'Unknown',
        })
        console.log(status)
      }
    }
    )
  }, [])
  return (
    <>
      <button onClick={() => supabaseClient.auth.signOut()}>Sign out</button>

      <p> List of Currenly Logged in Users: </p>
      {Object.keys(userState).map((key) => (
        <p key={key}>Hi {key}</p>
      ))}
    </>
  )
}

export const getServerSideProps = withPageAuth({ redirectTo: '/login' })

export default HomePage
