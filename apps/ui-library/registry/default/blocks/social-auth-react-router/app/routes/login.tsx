import { redirect, useFetcher, useSearchParams, type ActionFunctionArgs } from 'react-router'

import { safeNextPath } from '@/registry/default/blocks/safe-next-path/lib/safe-next-path'
import { createClient } from '@/registry/default/clients/react-router/lib/supabase/server'
import { Button } from '@/registry/default/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/registry/default/components/ui/card'

export const action = async ({ request }: ActionFunctionArgs) => {
  const { supabase, headers } = createClient(request)
  const origin = new URL(request.url).origin

  const formData = await request.formData()
  const next = safeNextPath(formData.get('next'), '/protected', origin)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${origin}/auth/oauth?next=${encodeURIComponent(next)}`,
    },
  })

  if (data.url) {
    return redirect(data.url, { headers })
  }

  if (error) {
    return {
      error: error instanceof Error ? error.message : 'An error occurred',
    }
  }
}

export default function Login() {
  const fetcher = useFetcher<typeof action>()
  const [searchParams] = useSearchParams()

  const error = fetcher.data?.error
  const loading = fetcher.state === 'submitting'

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Welcome!</CardTitle>
              <CardDescription>Sign in to your account to continue</CardDescription>
            </CardHeader>
            <CardContent>
              <fetcher.Form method="post">
                <input type="hidden" name="next" value={searchParams.get('next') ?? ''} />
                <div className="flex flex-col gap-6">
                  {error && <p className="text-sm text-destructive-500">{error}</p>}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Signing in...' : 'Continue with GitHub'}
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
