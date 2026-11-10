import { createFileRoute } from '@tanstack/react-router'

import { Usage } from '@/components/interfaces/Organization/Usage/Usage'

export const Route = createFileRoute('/_app/org/$slug/usage')({
  component: OrgUsagePage,
  staticData: {
    orgLayoutTitle: 'Usage',
  },
})

function OrgUsagePage() {
  return <Usage />
}
