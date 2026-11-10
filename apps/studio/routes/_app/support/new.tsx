import { createFileRoute } from '@tanstack/react-router'

import { SupportFormPage } from '@/components/interfaces/Support/SupportFormPage'
import { withAuth } from '@/hooks/misc/withAuth'

export const Route = createFileRoute('/_app/support/new')({
  component: SupportNewRoute,
  // _app shell reads hideMobileMenu from leaf staticData and forwards it to
  // DefaultLayout.
  staticData: { hideMobileMenu: true },
})

function SupportNewRoute() {
  return <SupportPageWithAuth />
}

function SupportPage() {
  return <SupportFormPage />
}

const SupportPageWithAuth = withAuth(SupportPage)
