import { createFileRoute } from '@tanstack/react-router'

import { ProjectCreationForm } from '@/components/interfaces/ProjectCreation/ProjectCreationForm'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import WizardLayout from '@/components/layouts/WizardLayout'
import { useCustomContent } from '@/hooks/custom-content/useCustomContent'
import { buildStudioPageTitle } from '@/lib/page-title'

export const Route = createFileRoute('/new/$slug')({
  component: NewProjectRoute,
})

// Top-level rather than under _app: this page renders without AppLayout.
// WizardLayout's default export is `withAuth(WizardLayout)`, which provides
// both the auth guard and the centered, max-w-2xl wizard column.
function NewProjectRoute() {
  return (
    <DefaultLayout hideMobileMenu headerTitle="New project">
      <WizardLayout>
        <Wizard />
      </WizardLayout>
    </DefaultLayout>
  )
}

function Wizard() {
  const { appTitle } = useCustomContent(['app:title'])
  const pageTitle = buildStudioPageTitle({
    section: 'New Project',
    brand: appTitle || 'Supabase',
  })

  return (
    <>
      {/* Wizard layouts set the visual header but not the browser tab title. */}
      <title>{pageTitle}</title>
      <meta name="description" content="Supabase Studio" />
      <ProjectCreationForm />
    </>
  )
}
