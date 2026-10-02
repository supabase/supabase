import { createFileRoute } from '@tanstack/react-router'

import GenericProjectPage from '@/pages/project/_/[[...routeSlug]]'

export const Route = createFileRoute('/project/_/$')({
  component: ProjectWildcardSplatRoute,
})

// Matches `/project/_/...`. TanStack exposes the trailing path as the
// `_splat` param; the underlying Next page normalises it back to the
// `routeSlug: string[]` shape it originally consumed.
//
// Naming delta: `project.[_].$.tsx` (path-as-filename) rather than
// `project/[_]/$.tsx` (nested directory) — see `org.[_].tsx` for the
// full rationale; in short, the directory + index.tsx form trips a
// router-generator bug that strips the escaped `_` segment when the
// last segment isn't escaped.
function ProjectWildcardSplatRoute() {
  return <GenericProjectPage />
}
