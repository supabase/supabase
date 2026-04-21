import { createFileRoute } from '@tanstack/react-router'

import RedeemCreditsLayout from '@/components/layouts/RedeemCreditsLayout'
import RedeemCreditsPage from '@/pages/redeem'

export const Route = createFileRoute('/redeem')({
  component: Redeem,
})

function Redeem() {
  return (
    <RedeemCreditsLayout>
      <RedeemCreditsPage dehydratedState={undefined} />
    </RedeemCreditsLayout>
  )
}
