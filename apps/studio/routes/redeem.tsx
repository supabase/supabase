import { createFileRoute } from '@tanstack/react-router'

import RedeemCreditsPage from '@/pages/redeem'

export const Route = createFileRoute('/redeem')({
  component: RedeemRoute,
})

function RedeemRoute() {
  return <RedeemCreditsPage dehydratedState={undefined} />
}
