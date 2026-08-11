import { createFileRoute, redirect, type AnyRouter } from '@tanstack/react-router'

import { IS_PLATFORM } from '@/lib/constants'

// `/` is never rendered — it always redirects. Mirrors the Next.js
// `redirects()` rules in next.config.ts: platform sends users to `/org`
// (or `/new/new-project` when deep-linked with `?next=new-project`),
// self-hosted sends them straight to `/project/default`.
export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>) => ({
    next: typeof search.next === 'string' ? search.next : undefined,
  }),
  beforeLoad: ({ search, location }) => {
    // Next's redirects() carries the incoming query and hash through to the
    // destination — deep links like `/?next=new-project&projectName=x` must
    // keep `projectName`. Only the consumed `next` param is dropped (and only
    // when it matched); everything else passes through.
    const carried = (shouldConsumeNext: boolean) => {
      const carriedSearch: Record<string, unknown> = { ...location.search }
      if (shouldConsumeNext) delete carriedSearch.next
      return carriedSearch
    }
    // `to`, never `href`: preloading a Link whose beforeLoad throws
    // `redirect({ href })` recurses forever
    // (https://github.com/TanStack/router/issues/7141). The `<AnyRouter,
    // string>` type arguments opt out of the registered route tree's strict
    // typing so the carried free-form search record is accepted.
    if (IS_PLATFORM) {
      if (search.next === 'new-project') {
        throw redirect<AnyRouter, string>({
          to: '/new/new-project',
          search: carried(true),
          hash: location.hash,
        })
      }
      throw redirect<AnyRouter, string>({ to: '/org', search: carried(false), hash: location.hash })
    }
    throw redirect<AnyRouter, string>({
      to: '/project/default',
      search: carried(false),
      hash: location.hash,
    })
  },
})
