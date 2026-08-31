import { createFileRoute } from '@tanstack/react-router'

import StripeAtlasApplicationPage from '@/pages/stripe-atlas-application'

export const Route = createFileRoute('/stripe-atlas-application')({
  component: StripeAtlasApplication,
})

function StripeAtlasApplication() {
  return <StripeAtlasApplicationPage dehydratedState={undefined} />
}
