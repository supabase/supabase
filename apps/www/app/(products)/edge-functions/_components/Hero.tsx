import Link from 'next/link'
import { Button } from 'ui'

export function Hero() {
  return (
    <div className="mx-auto max-w-[var(--container-max-w,75rem)] px-6 pt-32 pb-16 md:pt-40 md:pb-32">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-end">
        <div className="flex flex-col gap-6 lg:gap-8">
          <h1 className="text-foreground text-3xl sm:text-5xl sm:leading-none">
            <span className="block">Edge Functions</span>
            <span className="text-foreground-lighter block">globally in seconds</span>
          </h1>
          <div className="flex items-center gap-2">
            <Button asChild size="medium">
              <Link href="https://supabase.com/dashboard">Start your project</Link>
            </Button>
            <Button asChild size="medium" type="default">
              <Link href="/docs/guides/functions">Documentation</Link>
            </Button>
          </div>
        </div>
        <p className="text-foreground-lighter text-sm lg:text-base">
          Easily author, deploy and monitor serverless functions distributed globally at the edge,
          close to your users.
        </p>
      </div>
    </div>
  )
}
