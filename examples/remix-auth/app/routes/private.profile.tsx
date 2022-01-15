import type { ActionFunction, LoaderFunction } from 'remix'
import { Form, json, useLoaderData } from 'remix'
import { authenticator, supabaseStrategy } from '~/auth.server'

type LoaderData = { email?: string; id?: string }

export const action: ActionFunction = async ({ request }) => {
  await authenticator.logout(request, { redirectTo: '/login' })
}

export const loader: LoaderFunction = async ({ request }) => {
  const session = await supabaseStrategy.checkSession(request, {
    failureRedirect: '/login?redirectTo=/private/profile',
  })

  return json<LoaderData>({ email: session.user?.email, id: session.user?.id })
}

export default function Screen() {
  const { email, id } = useLoaderData<LoaderData>()
  return (
    <>
      <h1>Hello {email}</h1>
      <h2>Welcome in Private Profile</h2>
      <h3>Your user id is {id}</h3>

      <Form method="post">
        <button>Log Out</button>
      </Form>
    </>
  )
}
