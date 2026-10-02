import { createFileRoute } from '@tanstack/react-router'

import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import WizardLayout from '@/components/layouts/WizardLayout'
import Wizard from '@/pages/new/[slug]'

export const Route = createFileRoute('/new/$slug')({
  component: NewProjectRoute,
})

// Placed at top-level rather than under _app — the Next getLayout omits
// AppLayout. The Next page wraps the wizard in a local `PageLayout` that is
// just `withAuth(WizardLayoutWithoutAuth)` (NOT the shared PageLayout), giving
// the centered, max-w-2xl wizard column. WizardLayout's default export is the
// same `withAuth(WizardLayout)`, so we use it here to preserve both the auth
// guard and that constrained width — the shared PageLayout rendered the form
// full-width.
function NewProjectRoute() {
  return (
    <DefaultLayout hideMobileMenu headerTitle="New project">
      <WizardLayout>
        <Wizard dehydratedState={undefined} />
      </WizardLayout>
    </DefaultLayout>
  )
}
