import { createClient } from '@/registry/default/clients/react-router/lib/supabase/server'
import { Button } from '@/registry/default/components/ui/button'
import { Input } from '@/registry/default/components/ui/input'
import { AuthApiError } from '@supabase/supabase-js'
import { type ActionFunctionArgs, Form, data, useActionData } from 'react-router'

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const email = formData.get('email') as string

  if (!email) {
    return data({
      message: 'Please provide an email',
      errors: { email: 'Email is required' },
      data: { email: '' },
    })
  }

  const { supabase, headers } = createClient(request)
  const origin = new URL(request.url).origin

  // Send the actual reset password email
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/update-password`,
  })

  if (error) {
    if (error instanceof AuthApiError && error.status === 400) {
      return data(
        {
          message: 'Invalid credentials.',
          errors: { email: 'Invalid email address' },
          data: { email },
        },
        { headers }
      )
    }
    return data(
      {
        message: error.message,
        errors: { email: error.message },
        data: { email },
      },
      { headers }
    )
  }

  return data(
    {
      message: 'Please check your email for a password reset link to log into the website.',
      errors: {},
      data: { email: '' },
    },
    { headers }
  )
}

export default function ForgotPassword() {
  const actionData = useActionData<typeof action>()

  return (
    <div className="max-w-md mx-auto mt-24">
      {actionData?.message ? (
        <div className={`alert-error mb-10`}>{actionData?.message}</div>
      ) : null}
      <h2 className="font-semibold text-xl mb-4">Forgot Password</h2>
      <p className="mb-4">Reset your password using your email address</p>
      <Form method="post">
        <div className="form-control">
          <Input
            id="email"
            name="email"
            type="text"
            placeholder="you@example.com"
            defaultValue={actionData?.data?.email}
            className="input input-bordered"
          />
        </div>
        {actionData?.errors &&
          Object.values(actionData.errors).map((error, index) =>
            error ? (
              <div key={index} className="text-error mt-1">
                {error as string}
              </div>
            ) : null
          )}
        <div className="form-control mt-6">
          <Button className="btn btn-primary no-animation">Send</Button>
        </div>
      </Form>
    </div>
  )
}
