import { redirect, useFetcher, type ActionFunctionArgs } from 'react-router'

import { createClient } from '@/registry/default/clients/react-router/lib/supabase/server'
import { Button } from '@/registry/default/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/registry/default/components/ui/card'
import { Input } from '@/registry/default/components/ui/input'
import { Label } from '@/registry/default/components/ui/label'

export const action = async ({ request }: ActionFunctionArgs) => {
  const { supabase, headers } = createClient(request)
  const formData = await request.formData()
  const password = formData.get('password') as string

  if (!password) {
    return { error: 'Password is required' }
  }

  const { error } = await supabase.auth.updateUser({ password: password })

  if (error) {
    return {
      error: error instanceof Error ? error.message : 'An error occurred',
    }
  }

  // Redirect to sign-in page after successful password update
  return redirect('/protected', { headers })
}

export default function Page() {
  const fetcher = useFetcher<typeof action>()

  const error = fetcher.data?.error
  const loading = fetcher.state === 'submitting'

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Reset Your Password</CardTitle>
              <CardDescription>Please enter your new password below.</CardDescription>
            </CardHeader>
            <CardContent>
              <fetcher.Form method="post">
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="password">New password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="New password"
                      required
                    />
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Saving...' : 'Save new password'}
                  </Button>
                </div>
              </fetcher.Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
