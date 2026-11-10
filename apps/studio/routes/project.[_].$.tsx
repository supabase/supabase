import { createFileRoute } from '@tanstack/react-router'

import { SelectProjectPage } from '@/components/interfaces/Home/ProjectList/SelectProjectPage'

export const Route = createFileRoute('/project/_/$')({
  component: ProjectWildcardSplatRoute,
})

// Matches `/project/_/...`; the trailing path arrives as the `_splat` param.
//
// Naming delta: `project.[_].$.tsx` (path-as-filename) rather than
// `project/[_]/$.tsx` (nested directory) — see `org.[_].tsx` for the
// full rationale; in short, the directory + index.tsx form trips a
// router-generator bug that strips the escaped `_` segment when the
// last segment isn't escaped.
function ProjectWildcardSplatRoute() {
  const { _splat } = Route.useParams()
  return <SelectProjectPage routeSlug={_splat ? _splat.split('/') : undefined} />
}
