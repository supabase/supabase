import { createClient } from '@/registry/default/clients/nextjs/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/registry/default/components/ui/card'
import { Button } from '@/registry/default/components/ui/button'

export default async function ProtectedPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/passwordless')
  }

  const handleSignOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/auth/passwordless')
  }

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
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium">User ID</p>
                <p className="text-sm text-muted-foreground">{user.id}</p>
              </div>
              <form action={handleSignOut}>
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
