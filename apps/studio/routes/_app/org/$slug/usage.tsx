import { createFileRoute } from '@tanstack/react-router'

import OrgUsagePage from '@/pages/org/[slug]/usage'

export const Route = createFileRoute('/_app/org/$slug/usage')({
  component: OrgUsage,
  staticData: {
    orgLayoutTitle: 'Usage',
  },
})

function OrgUsage() {
  return <OrgUsagePage dehydratedState={undefined} />
}
