import { createFileRoute } from '@tanstack/react-router'

import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { PageLayout } from '@/components/layouts/PageLayout/PageLayout'
import Wizard from '@/pages/new/[slug]'

export const Route = createFileRoute('/new/$slug')({
  component: NewProjectRoute,
})

// Placed at top-level rather than under _app — the Next getLayout omits
// AppLayout, and uses PageLayout (not WizardLayout) inside DefaultLayout.
function NewProjectRoute() {
  return (
    <DefaultLayout hideMobileMenu headerTitle="New project">
      <PageLayout>
        <Wizard dehydratedState={undefined} />
      </PageLayout>
    </DefaultLayout>
  )
}
