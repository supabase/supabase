import { createFileRoute } from '@tanstack/react-router'

import GenericOrganizationPage from '@/pages/org/_/[[...routeSlug]]'

export const Route = createFileRoute('/org/_/$')({
  component: OrgWildcardSplatRoute,
})

// Matches `/org/_/...`. TanStack exposes the trailing path as the
// `_splat` param; the underlying Next page normalises it back to the
// `routeSlug: string[]` shape it originally consumed.
//
// Naming delta: `org.[_].$.tsx` (path-as-filename) rather than
// `org/[_]/$.tsx` (nested directory) — see `org.[_].tsx` for the full
// rationale; in short, the directory + index.tsx form trips a
// router-generator bug that strips the escaped `_` segment when the
// last segment isn't escaped.
function OrgWildcardSplatRoute() {
  return <GenericOrganizationPage />
}
