import { A } from '@solidjs/router'
import { action, redirect, useAction, useSubmission } from '@solidjs/router'
import { Show } from 'solid-js'
import { createClient } from '~/lib/supabase/server'

const signInAction = action(async (formData: FormData) => {
  'use server'
  const email = formData.get('email')?.toString()
  const password = formData.get('password')?.toString()

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  throw redirect('/')
})

const signUpAction = action(async (formData: FormData) => {
  'use server'
  const email = formData.get('email')?.toString()
  const password = formData.get('password')?.toString()

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = createClient()
  const { error } = await supabase.auth.signUp({ email, password })

  if (error) {
    return { error: error.message }
  }

  return { success: 'Check your email to confirm your account!' }
})

export default function Login() {
  const signIn = useAction(signInAction)
  const signUp = useAction(signUpAction)
  const signingIn = useSubmission(signInAction)
  const signingUp = useSubmission(signUpAction)

  return (
    <div style={{ 'max-width': '400px', margin: '50px auto', padding: '20px' }}>
      <A href="/" style={{ 'margin-bottom': '20px', display: 'inline-block' }}>
        ← Back
      </A>

      <h1>Sign In / Sign Up</h1>

      <form method="post" style={{ 'margin-bottom': '20px' }} onsubmit={(e) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        signIn(formData)
      }}>
        <div style={{ 'margin-bottom': '15px' }}>
          <label for="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            style={{ width: '100%', padding: '8px', 'margin-top': '5px' }}
          />
        </div>

        <div style={{ 'margin-bottom': '15px' }}>
          <label for="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            placeholder="••••••••"
            style={{ width: '100%', padding: '8px', 'margin-top': '5px' }}
          />
        </div>

        <button
          type="submit"
          disabled={signingIn.pending}
          style={{
            padding: '10px 20px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            'border-radius': '4px',
            cursor: signingIn.pending ? 'not-allowed' : 'pointer',
            'margin-right': '10px'
          }}
        >
          {signingIn.pending ? 'Signing In...' : 'Sign In'}
        </button>

        <button
          type="button"
          onclick={(e) => {
            const form = e.currentTarget.closest('form')!
            signUp(new FormData(form))
          }}
          disabled={signingUp.pending}
          style={{
            padding: '10px 20px',
            background: '#6366f1',
            color: 'white',
            border: 'none',
            'border-radius': '4px',
            cursor: signingUp.pending ? 'not-allowed' : 'pointer'
          }}
        >
          {signingUp.pending ? 'Signing Up...' : 'Sign Up'}
        </button>

        <Show when={signingIn.result?.error || signingUp.result?.error}>
          <p style={{ color: 'red', 'margin-top': '10px' }}>
            {signingIn.result?.error || signingUp.result?.error}
          </p>
        </Show>

        <Show when={signingUp.result?.success}>
          <p style={{ color: 'green', 'margin-top': '10px' }}>
            {signingUp.result?.success}
          </p>
        </Show>
      </form>
    </div>
  )
}
