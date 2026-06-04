import { TriangleAlert } from 'lucide-react'

import { Callout } from './callout'

export default function TanStackBeta() {
  return (
    <div className="mt-4">
      <Callout>
        <div className="grid gap-2">
          <div className="flex items-center gap-2 font-medium">
            <TriangleAlert />
            Heads up: TanStack Start is in beta.
          </div>
          We&apos;re excited to support TanStack Start in our UI library! But since it&apos;s still
          in beta, things may change quickly — expect breaking changes and some rough edges.
          We&apos;ll do our best to keep up and make integration with Supabase as smooth as
          possible. If you run into issues, have a look at the TanStack docs.
          <a
            href="https://tanstack.com/start/latest/docs/framework/react/quick-start"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline decoration-1 decoration-foreground-muted underline-offset-4 transition-colors hover:decoration-brand hover:decoration-2"
          >
            TanStack Quickstart guide
          </a>
        </div>
      </Callout>
    </div>
  )
}
