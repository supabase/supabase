import { createFileRoute } from '@tanstack/react-router'

import { SelectOrganizationPage } from '@/components/interfaces/Organization/SelectOrganizationPage'

export const Route = createFileRoute('/org/_/$')({
  component: OrgWildcardSplatRoute,
})

// Registers `/org/_/...`. Its parent `org.[_].tsx` renders the picker, which
// reads the trailing path from the location.
//
// Naming delta: `org.[_].$.tsx` (path-as-filename) rather than
// `org/[_]/$.tsx` (nested directory) — see `org.[_].tsx` for the full
// rationale; in short, the directory + index.tsx form trips a
// router-generator bug that strips the escaped `_` segment when the
// last segment isn't escaped.
function OrgWildcardSplatRoute() {
  return <SelectOrganizationPage />
}
