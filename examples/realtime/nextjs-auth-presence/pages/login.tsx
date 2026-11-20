import type { NextPage } from 'next'
import { FormEvent, useState } from 'react'

import styles from '../styles/Home.module.css'
import { useSupabaseClient, useUser } from '@/lib/supabase-context'

type Mode = 'sign-in' | 'sign-up'

const LoginPage: NextPage = () => {
  const supabaseClient = useSupabaseClient()
  const user = useUser()

  const [mode, setMode] = useState<Mode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setMessage(null)
    setError(null)

    if (mode === 'sign-in') {
      const { error } = await supabaseClient.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/` },
      })
      if (error) {
        setError(error.message)
      } else if (data.user && !data.session) {
        setMessage('Check your email for a confirmation link to complete sign up.')
      }
    }

    setLoading(false)
  }

  if (!user) {
    return (
      <main className={styles.main}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, minWidth: 280 }}>
          <h1>{mode === 'sign-in' ? 'Sign in' : 'Sign up'}</h1>
          <label style={{ display: 'grid', gap: 4 }}>
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>
          <label style={{ display: 'grid', gap: 4 }}>
            Password
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
            />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? 'Loading...' : mode === 'sign-in' ? 'Sign in' : 'Sign up'}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')
              setError(null)
              setMessage(null)
            }}
          >
            {mode === 'sign-in' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
          </button>
          {error && <p style={{ color: 'crimson' }}>{error}</p>}
          {message && <p>{message}</p>}
        </form>
      </main>
    )
  }

  return (
    <>
      <button onClick={() => supabaseClient.auth.signOut()}>Sign out</button>
      <p>user:</p>
      <pre>{JSON.stringify(user, null, 2)}</pre>
    </>
  )
}

export default LoginPage
