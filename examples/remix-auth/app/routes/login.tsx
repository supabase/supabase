import type { ActionFunction, LoaderFunction } from 'remix'
import { Form, json, useLoaderData, useSearchParams } from 'remix'
import { authenticator, sessionStorage, supabaseStrategy } from '~/auth.server'

type LoaderData = {
  error: { message: string } | null
}

export const action: ActionFunction = async ({ request }) => {
  const data = await request.clone().formData()
  const redirectTo = (data.get('redirectTo') ?? '/private') as string

  await authenticator.authenticate('sb', request, {
    successRedirect: redirectTo,
    failureRedirect: '/login',
  })
}

export const loader: LoaderFunction = async ({ request }) => {
  const redirectTo = new URL(request.url).searchParams.get('redirectTo') ?? '/private'

  await supabaseStrategy.checkSession(request, {
    successRedirect: redirectTo,
  })

  const session = await sessionStorage.getSession(request.headers.get('Cookie'))

  const error = session.get(authenticator.sessionErrorKey) as LoaderData['error']

  return json<LoaderData>({ error })
}

export default function Screen() {
  const [searchParams] = useSearchParams()
  const { error } = useLoaderData<LoaderData>()

  return (
    <Form method="post">
      {error && <div>{error.message}</div>}
      <input
        name="redirectTo"
        value={searchParams.get('redirectTo') ?? undefined}
        hidden
        readOnly
      />
      <div>
        <label htmlFor="email">Email</label>
        <input type="email" name="email" id="email" />
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input type="password" name="password" id="password" />
      </div>

      <button>Log In</button>
    </Form>
  )
}
