import { Button } from '@/registry/default/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/registry/default/components/ui/card'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { createClient } from '@/registry/default/clients/tanstack/lib/supabase/client'

export const Route = createFileRoute('/_protected/protected')({
  component: ProtectedPage,
})

function ProtectedPage() {
  const router = useRouter()
  const { user } = Route.useRouteContext()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.navigate({ to: '/passwordless' })
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
              <Button onClick={handleSignOut} variant="outline" className="w-full">
                Sign out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
