import { A, createAsync, query } from '@solidjs/router'
import { Show } from 'solid-js'
import { createClient } from '~/lib/supabase/server'

const getUser = query(async () => {
  'use server'
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}, 'user')

export const route = {
  load: () => getUser()
}

export default function Home() {
  const user = createAsync(() => getUser())

  return (
    <div style={{ padding: '20px', 'max-width': '800px', margin: '0 auto' }}>
      <h1>SolidStart + Supabase SSR Example</h1>
      <p style={{ color: '#666', 'margin-bottom': '30px' }}>
        This example demonstrates server-side authentication with Supabase in SolidStart
      </p>

      <Show
        when={user()}
        fallback={
          <div>
            <p>You are not authenticated.</p>
            <A href="/login">
              <button style={{
                padding: '10px 20px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                'border-radius': '4px',
                cursor: 'pointer',
                'margin-top': '10px'
              }}>
                Sign In / Sign Up
              </button>
            </A>
          </div>
        }
      >
        <div>
          <p>Welcome back, <strong>{user()!.email}</strong>!</p>

          <div style={{ 'margin-top': '20px' }}>
            <A href="/protected">
              <button style={{
                padding: '10px 20px',
                background: '#7c3aed',
                color: 'white',
                border: 'none',
                'border-radius': '4px',
                cursor: 'pointer',
                'margin-right': '10px'
              }}>
                Visit Protected Page
              </button>
            </A>

            <form action="/logout" method="post" style={{ display: 'inline' }}>
              <button type="submit" style={{
                padding: '10px 20px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                'border-radius': '4px',
                cursor: 'pointer'
              }}>
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </Show>

      <footer style={{
        'margin-top': '60px',
        'padding-top': '20px',
        'border-top': '1px solid #e5e7eb',
        color: '#666',
        'font-size': '14px'
      }}>
        <p>
          Powered by{' '}
          <a href="https://supabase.com" target="_blank" style={{ color: '#10b981', 'font-weight': 'bold' }}>
            Supabase
          </a>
        </p>
      </footer>
    </div>
  )
}
