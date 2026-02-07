import { A, createAsync, query, redirect } from '@solidjs/router'
import { createClient } from '~/lib/supabase/server'

const getUser = query(async () => {
  'use server'
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw redirect('/login')
  }

  return user
}, 'protected-user')

export const route = {
  load: () => getUser()
}

export default function Protected() {
  const user = createAsync(() => getUser())

  return (
    <div style={{ padding: '20px' }}>
      <div style={{
        background: '#7c3aed',
        color: 'white',
        padding: '20px',
        'text-align': 'center',
        'margin-bottom': '20px'
      }}>
        This is a protected page - you can only see this when authenticated
      </div>

      <h1>Protected Page</h1>
      <p>Welcome, {user()?.email}!</p>
      <p>User ID: {user()?.id}</p>

      <A href="/">
        <button style={{
          padding: '10px 20px',
          background: '#10b981',
          color: 'white',
          border: 'none',
          'border-radius': '4px',
          cursor: 'pointer',
          'margin-top': '20px'
        }}>
          Back to Home
        </button>
      </A>
    </div>
  )
}
