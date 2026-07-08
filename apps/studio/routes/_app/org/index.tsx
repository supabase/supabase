import { createFileRoute } from '@tanstack/react-router'

import OrgIndexPage from '@/pages/org/index'

export const Route = createFileRoute('/_app/org/')({
  component: OrgIndex,
  staticData: {
    orgLayoutTitle: 'Organizations',
  },
})

function OrgIndex() {
  return <OrgIndexPage dehydratedState={undefined} />
}
