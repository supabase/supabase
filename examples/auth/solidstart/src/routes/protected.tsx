import { createServerData$, redirect } from 'solid-start/server'
import { useRouteData } from 'solid-start'

export const routeData = createServerData$(async (_, { request }) => {
  const { safeGetSession } = request.locals

  const { session, user } = await safeGetSession()

  if (!session) {
    throw redirect('/login')
  }

  return { session, user }
})

export default function Protected() {
  const data = useRouteData<typeof routeData>()

  return (
    <div class="container">
      <h1>Protected Route</h1>
      <p>This page is protected and can only be accessed by authenticated users.</p>

      <div>
        <h2>User Information</h2>
        <p>Email: {data()?.user?.email}</p>
        <p>User ID: {data()?.user?.id}</p>
        <p>Last sign in: {new Date(data()?.user?.last_sign_in_at!).toLocaleString()}</p>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <a href="/">Back to Home</a>
      </div>
    </div>
  )
}
