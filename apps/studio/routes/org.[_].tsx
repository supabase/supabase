import { createFileRoute } from '@tanstack/react-router'

import { SelectOrganizationPage } from '@/components/interfaces/Organization/SelectOrganizationPage'

export const Route = createFileRoute('/org/_')({
  component: OrgWildcardIndexRoute,
})

// Matches `/org/_`, and is also the parent of the splat route in
// `org.[_].$.tsx` (`/org/_/...`). It renders no `<Outlet>`, so this
// component renders for both.
//
// `[_]` is TanStack's escape syntax for a literal underscore in the URL
// (otherwise an unescaped `_` segment is treated as a pathless layout).
//
// Naming delta: this is `org.[_].tsx`, not `org/[_]/index.tsx`, to side-
// step a router-generator bug — when an index.tsx's path has a bracket-
// escaped *parent* segment, `originalRoutePath` gets wiped wholesale and
// the escape info is lost (getRouteNodes.js:132 sets originalRoutePath
// to `/`). The path-as-filename form keeps the last segment non-index,
// so the bug branch is skipped.
function OrgWildcardIndexRoute() {
  return <SelectOrganizationPage />
}
