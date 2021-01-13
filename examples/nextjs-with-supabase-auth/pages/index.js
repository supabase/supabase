import useSWR from 'swr'
import { Auth } from '@supabase/ui'
import { supabase } from '../utils/initSupabase'
import { useEffect, useState } from 'react'

const fetcher = (url, token) =>
  fetch(url, {
    method: 'GET',
    headers: new Headers({ 'Content-Type': 'application/json', token }),
    credentials: 'same-origin',
  }).then((res) => res.json())

const Index = () => {
  const { user, session } = Auth.useUser()
  const { data, error } = useSWR(session ? ['/api/getUser', session.access_token] : null, fetcher)
  const [authView, setAuthView] = useState('sign_in')

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setAuthView('update_password')
      if (event === 'USER_UPDATED') setTimeout(() => setAuthView('sign_in'), 1000)
    })

    return () => {
      authListener.unsubscribe()
    }
  }, [])

  if (!user)
    return <Auth supabaseClient={supabase} providers={['google', 'github']} view={authView} />

  return (
    <div>
      {authView === 'update_password' && <Auth.UpdatePassword supabaseClient={supabase} />}
      {user && (
        <div>
          <p
            style={{
              display: 'inline-block',
              color: 'blue',
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
            onClick={() => supabase.auth.signOut()}
          >
            Log out
          </p>
          <div>
            <p>You're signed in. Email: {user.email}</p>
          </div>
          {error && <div>Failed to fetch user!</div>}
          {data && !error ? (
            <div>
              <span>User data retrieved server-side (in API route):</span>
              <pre>{JSON.stringify(data, null, 2)}</pre>
            </div>
          ) : (
            <div>Loading...</div>
          )}
        </div>
      )}
    </div>
  )
}

export default Index
