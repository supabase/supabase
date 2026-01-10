import { action, redirect, useAction } from '@solidjs/router'
import { getSupabaseServerClient } from '~/lib/supabase/server'

const loginAction = action(async (formData: FormData) => {
  'use server'
  const emailEntry = formData.get('email')
  const passwordEntry = formData.get('password')

  // Validate that fields exist and are non-empty
  if (!emailEntry || typeof emailEntry !== 'string' || !emailEntry.trim()) {
    return { error: 'Email is required' }
  }

  if (!passwordEntry || typeof passwordEntry !== 'string' || !passwordEntry.trim()) {
    return { error: 'Password is required' }
  }

  const email = emailEntry.toString()
  const password = passwordEntry.toString()

  const supabase = getSupabaseServerClient()
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  throw redirect('/')
})

export default function Login() {
  const login = useAction(loginAction)

  return (
    <main>
      <h1>Sign In</h1>

      <form action={login} method="post">
        <div>
          <label for="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label for="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            placeholder="••••••••"
          />
        </div>

        <button type="submit">Sign In</button>
      </form>
    </main>
  )
}
