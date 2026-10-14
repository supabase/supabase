import Link from 'next/link'
import { Button, Input } from 'ui'

import { requestMagicLink } from '@/app/login/actions'

type LoginPageProps = {
  searchParams: Promise<{ message?: string; next?: string }>
}

const LoginPage = async ({ searchParams }: LoginPageProps) => {
  const params = await searchParams
  const next = params.next?.startsWith('/') ? params.next : '/quality'
  const message = params.message

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 pt-16 pb-16">
      <div className="space-y-2">
        <h1 className="text-2xl font-medium text-foreground">Sign in</h1>
        <p className="text-sm text-foreground-light">
          Use your @supabase.com or @supabase.io email. We send a magic link — no password.
        </p>
      </div>

      <form action={requestMagicLink} className="flex flex-col gap-4">
        <input name="next" type="hidden" value={next} />
        <label className="flex flex-col gap-2 text-sm text-foreground" htmlFor="email">
          Email
          <Input
            autoComplete="email"
            id="email"
            name="email"
            placeholder="you@supabase.com"
            required
            type="email"
          />
        </label>
        <Button type="submit" variant="primary">
          Email magic link
        </Button>
      </form>

      {message ? (
        <p className="rounded-md border border-border bg-surface-100 px-3 py-2 text-sm text-foreground">
          {message}
        </p>
      ) : null}

      <Link className="text-sm text-foreground-light hover:text-foreground" href="/">
        Back to community docs
      </Link>
    </main>
  )
}

export default LoginPage
