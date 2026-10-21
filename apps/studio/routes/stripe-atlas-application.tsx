import { createFileRoute } from '@tanstack/react-router'

import StripeAtlasApplicationPage from '@/pages/stripe-atlas-application'

export const Route = createFileRoute('/stripe-atlas-application')({
  component: StripeAtlasApplicationRoute,
})

function StripeAtlasApplicationRoute() {
  return <StripeAtlasApplicationPage dehydratedState={undefined} />
}
