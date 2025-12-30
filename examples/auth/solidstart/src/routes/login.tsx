import { createServerData$, redirect } from 'solid-start/server'
import { createRouteAction, useRouteData } from 'solid-start'
import { Show } from 'solid-js'
import { createBrowserClient } from '@supabase/ssr'

export const routeData = createServerData$(async (_, { request }) => {
  const { safeGetSession } = request.locals

  const { session } = await safeGetSession()

  if (session) {
    throw redirect('/')
  }

  return {}
})

export default function Login() {
  const data = useRouteData<typeof routeData>()

  const [loggingIn, { Form }] = createRouteAction(async (formData: FormData) => {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const supabase = createBrowserClient(
      process.env.PUBLIC_SUPABASE_URL,
      process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY
    )

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { error: error.message }
    }

    // Redirect will happen automatically due to the routeData check
    window.location.href = '/'
  })

  return (
    <div class="container">
      <div class="auth-container">
        <h1>Login</h1>

        <Form>
          <div class="form-group">
            <label for="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              disabled={loggingIn.pending}
            />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              required
              disabled={loggingIn.pending}
            />
          </div>

          <button type="submit" disabled={loggingIn.pending}>
            {loggingIn.pending ? 'Logging in...' : 'Login'}
          </button>

          <Show when={loggingIn.error}>
            <div class="error">{loggingIn.error.message}</div>
          </Show>
        </Form>

        <div style={{ marginTop: '1rem' }}>
          <a href="/">Back to Home</a>
        </div>
      </div>
    </div>
  )
}
