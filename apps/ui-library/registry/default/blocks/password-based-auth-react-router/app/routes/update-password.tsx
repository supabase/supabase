import { redirect } from 'react-router'
import { Form, useActionData } from 'react-router'
import type { ActionFunctionArgs } from 'react-router'

import { Input } from '@/registry/default/components/ui/input'
import { Button } from '@/registry/default/components/ui/button'
import { createClient } from '@/registry/default/clients/react-router/lib/supabase.server'

export const action = async ({ request }: ActionFunctionArgs) => {
  const { supabase, headers } = createClient(request)
  const formData = await request.formData()
  const password = formData.get('password') as string

  const { error } = await supabase.auth.updateUser({
    password: password,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  // Redirect to sign-in page after successful password update
  return redirect('/sign-in', { headers })
}

const ForgotPassword = () => {
  const actionData = useActionData<typeof action>()

  return (
    <div className="max-w-md mx-auto mt-24">
      <p>Update your password</p>
      <Form method="post" className="grid gap-4 mt-4">
        <Input type="password" name="password" placeholder="Password" required />
        <br />
        <Button type="submit">Update password</Button>
      </Form>
      {actionData?.error && <p style={{ color: 'red' }}>{actionData.error}</p>}
    </div>
  )
}

export default ForgotPassword
