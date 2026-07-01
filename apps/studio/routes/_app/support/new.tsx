import { createFileRoute } from '@tanstack/react-router'

import SupportPage from '@/pages/support/new'

export const Route = createFileRoute('/_app/support/new')({
  component: SupportNewRoute,
  // _app shell reads hideMobileMenu from leaf staticData and forwards it to
  // DefaultLayout. The Next-side getLayout sets hideMobileMenu on DefaultLayout.
  staticData: { hideMobileMenu: true },
})

function SupportNewRoute() {
  return <SupportPage dehydratedState={undefined} />
}
