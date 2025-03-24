import { Form, Link, useActionData, useNavigation } from 'react-router'
import type { ActionFunctionArgs } from 'react-router'
import { createClient } from '@/registry/default/clients/react-router/lib/supabase.server'
import { Input } from '@/registry/default/components/ui/input'
import { Label } from '@/registry/default/components/ui/label'
import { Button } from '@/registry/default/components/ui/button'

export const action = async ({ request }: ActionFunctionArgs) => {
  const { supabase, headers } = createClient(request)
  const formData = await request.formData()

  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return {
    success: true,
    error: null,
    message: 'Success! Please check your email for further instructions.',
  }
}

export const SignUp = () => {
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  return (
    <div className="max-w-md mx-auto mt-24">
      <Form method="post" className="flex-1 flex flex-col min-w-64">
        <h1 className="text-2xl font-medium">Sign up</h1>
        <p className="text-sm text-foreground">
          Already have an account?{' '}
          <Link className="text-foreground font-medium underline" to="/sign-in">
            Sign in
          </Link>
        </p>
        <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
          <Label htmlFor="email">Email</Label>
          <Input name="email" placeholder="you@example.com" required />
          <div className="flex justify-between items-center">
            <Label htmlFor="password">Password</Label>
          </div>
          <Input type="password" name="password" placeholder="Your password" required />
          <Button disabled={isSubmitting}>{isSubmitting ? 'Signing up...' : 'Sign up'}</Button>

          {!actionData?.success && actionData?.error && (
            <div className="flex flex-col gap-2 w-full max-w-md text-sm">
              {actionData.error && (
                <div className="text-foreground border-l-2 border-foreground px-4">
                  {actionData.error}
                </div>
              )}
            </div>
          )}
          {actionData?.success && (
            <div className="flex flex-col gap-2 w-full max-w-md text-sm">
              {actionData.message && (
                <div className="text-foreground border-l-2 border-foreground px-4">
                  {actionData.message}
                </div>
              )}
            </div>
          )}
        </div>
      </Form>
    </div>
  )
}

export default SignUp
