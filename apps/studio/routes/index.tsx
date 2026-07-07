import { createFileRoute, redirect } from '@tanstack/react-router'

import { IS_PLATFORM } from '@/lib/constants'

// `/` is never rendered — it always redirects. Mirrors the Next.js
// `redirects()` rules in next.config.ts: platform sends users to `/org`
// (or `/new/new-project` when deep-linked with `?next=new-project`),
// self-hosted sends them straight to `/project/default`.
export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>) => ({
    next: typeof search.next === 'string' ? search.next : undefined,
  }),
  beforeLoad: ({ search }) => {
    // `href` instead of `to` because these targets aren't in the TanStack
    // routeTree yet — they're still on the Next.js pages side during the
    // migration. Swap to `to` once `/org`, `/new/new-project`, and
    // `/project/default` are migrated.
    if (IS_PLATFORM) {
      if (search.next === 'new-project') throw redirect({ href: '/new/new-project' })
      throw redirect({ href: '/org' })
    }
    throw redirect({ href: '/project/default' })
  },
})
