import { createFileRoute } from '@tanstack/react-router'

import GenericProjectPage from '@/pages/project/_/[[...routeSlug]]'

export const Route = createFileRoute('/project/_')({
  component: ProjectWildcardIndexRoute,
})

// Matches `/project/_` exactly. The companion splat route at
// `project.[_].$.tsx` handles `/project/_/...`. See `org.[_].tsx` for
// why this is named with the path-as-filename form rather than
// `project/[_]/index.tsx`.
function ProjectWildcardIndexRoute() {
  return <GenericProjectPage />
}
