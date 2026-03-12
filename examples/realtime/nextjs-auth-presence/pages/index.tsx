import { useSupabaseClient, useUser } from '@/lib/supabase-context'
import { createServerClient } from '@supabase/ssr'
import { serialize } from 'cookie'
import { RealtimePresenceState } from '@supabase/supabase-js'
import type { GetServerSidePropsContext, NextPage } from 'next'
import { useEffect, useState } from 'react'

const HomePage: NextPage = () => {
  const supabaseClient = useSupabaseClient()
  const this_user = useUser()
  const [userState, setUserState] = useState<RealtimePresenceState>({})

  useEffect(() => {
    console.log('user: ', this_user)

    const channel = supabaseClient.channel('online-users', {
      config: {
        presence: {
          key: this_user?.email ? this_user?.email : 'Unknown',
        },
      },
    })

    channel.on('presence', { event: 'sync' }, () => {
      const presentState = channel.presenceState()

      console.log('inside presence: ', presentState)

      setUserState({ ...presentState })
    })

    channel.on('presence', { event: 'join' }, ({ newPresences }) => {
      console.log('New users have joined: ', newPresences)
    })

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const status = await channel.track({
          user_name: this_user?.email ? this_user?.email : 'Unknown',
        })
        console.log('status: ', status)
      }
    })
  }, [])
  return (
    <>
      <button onClick={() => supabaseClient.auth.signOut()}>Sign out</button>

      <p> List of Currently Logged in Users: </p>
      {Object.keys(userState).map((key) => (
        <p key={key}>Hi {key}</p>
      ))}
    </>
  )
}

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return Object.entries(ctx.req.cookies).map(([name, value]) => ({
            name,
            value: value ?? '',
          }))
        },
        setAll(cookiesToSet) {
          const existing = ctx.res.getHeader('Set-Cookie') ?? []
          ctx.res.setHeader('Set-Cookie', [
            ...(Array.isArray(existing) ? existing : [String(existing)]),
            ...cookiesToSet.map(({ name, value, options }) =>
              serialize(name, value, options)
            ),
          ])
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user)
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    }

  return {
    props: {
      user,
    },
  }
}

export default HomePage
