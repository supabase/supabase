import { createFileRoute } from '@tanstack/react-router'

import { SelectProjectPage } from '@/components/interfaces/Home/ProjectList/SelectProjectPage'

export const Route = createFileRoute('/project/_')({
  component: ProjectWildcardIndexRoute,
})

// Matches `/project/_`, and is also the parent of the splat route in
// `project.[_].$.tsx` (`/project/_/...`). It renders no `<Outlet>`, so this
// component renders for both. See `org.[_].tsx` for
// why this is named with the path-as-filename form rather than
// `project/[_]/index.tsx`.
function ProjectWildcardIndexRoute() {
  return <SelectProjectPage />
}
