import { createClient } from '@/registry/default/clients/react-router/lib/supabase/server'
import { Button } from '@/registry/default/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/registry/default/components/ui/card'
import { type LoaderFunctionArgs, redirect, useLoaderData } from 'react-router'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { supabase } = createClient(request)

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    return redirect('/passwordless')
  }

  return data
}

export default function ProtectedPage() {
  let data = useLoaderData<typeof loader>()

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Protected Page</CardTitle>
            <CardDescription>You are logged in</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{data.user.email}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium">User ID</p>
                <p className="text-sm text-muted-foreground">{data.user.id}</p>
              </div>
              <form method="post" action="/logout">
                <Button type="submit" variant="outline" className="w-full">
                  Sign out
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
