import { createServerData$, redirect } from 'solid-start/server'
import { createRouteAction, useRouteData } from 'solid-start'
import { Show } from 'solid-js'
import { createClient } from '~/lib/supabase'

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

    const supabase = createClient()

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
    <div style={{ padding: '2rem', 'max-width': '400px', margin: '0 auto' }}>
      <h1>Login</h1>

      <Form>
        <div style={{ 'margin-bottom': '1rem' }}>
          <label for="email" style={{ display: 'block', 'margin-bottom': '0.5rem' }}>Email</label>
          <input
            type="email"
            id="email"
            name="email"
            required
            disabled={loggingIn.pending}
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', 'border-radius': '4px' }}
          />
        </div>

        <div style={{ 'margin-bottom': '1rem' }}>
          <label for="password" style={{ display: 'block', 'margin-bottom': '0.5rem' }}>Password</label>
          <input
            type="password"
            id="password"
            name="password"
            required
            disabled={loggingIn.pending}
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', 'border-radius': '4px' }}
          />
        </div>

        <button
          type="submit"
          disabled={loggingIn.pending}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            'border-radius': '4px',
            cursor: 'pointer'
          }}
        >
          {loggingIn.pending ? 'Logging in...' : 'Login'}
        </button>

          <Show when={loggingIn.result?.error}>
            <div style={{ color: '#dc2626', 'margin-top': '0.5rem' }}>
              {loggingIn.result?.error}
            </div>
          </Show>
      </Form>

      <div style={{ 'margin-top': '1rem' }}>
        <a href="/">Back to Home</a>
      </div>
    </div>
  )
}