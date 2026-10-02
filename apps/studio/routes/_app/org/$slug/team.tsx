import { createFileRoute } from '@tanstack/react-router'

import OrgTeamSettingsPage from '@/pages/org/[slug]/team'

export const Route = createFileRoute('/_app/org/$slug/team')({
  component: OrgTeam,
  staticData: {
    orgLayoutTitle: 'Team',
  },
})

function OrgTeam() {
  return <OrgTeamSettingsPage dehydratedState={undefined} />
}
