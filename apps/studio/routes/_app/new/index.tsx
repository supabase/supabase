import { createFileRoute } from '@tanstack/react-router'

import WizardLayout from '@/components/layouts/WizardLayout'
import Wizard from '@/pages/new/index'

export const Route = createFileRoute('/_app/new/')({
  component: NewOrgRoute,
  staticData: {
    hideMobileMenu: true,
    defaultLayoutHeaderTitle: 'New organization',
  },
})

// Inline WizardLayout here rather than via a `_app/new.tsx` sub-shell —
// `_app/new/$slug.tsx` is not under _app (no AppLayout in Next), and the
// only other potential leaf has a different inner wrapper (PageLayout),
// so a shared shell would not actually share anything.
function NewOrgRoute() {
  return (
    <WizardLayout>
      <Wizard dehydratedState={undefined} />
    </WizardLayout>
  )
}
