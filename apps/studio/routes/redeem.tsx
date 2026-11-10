import { createFileRoute } from '@tanstack/react-router'

import { RedeemCreditsScreen } from '@/components/interfaces/RedeemCredits/RedeemCredits'
import { withAuth } from '@/hooks/misc/withAuth'
import { buildStudioPageTitle } from '@/lib/page-title'

export const Route = createFileRoute('/redeem')({
  component: RedeemRoute,
})

function RedeemRoute() {
  return <RedeemCreditsPageWithAuth />
}

const PAGE_TITLE = buildStudioPageTitle({ section: 'Redeem Credits', brand: 'Supabase' })

function RedeemCreditsPage() {
  return (
    <>
      <title>{PAGE_TITLE}</title>
      <RedeemCreditsScreen />
    </>
  )
}

const RedeemCreditsPageWithAuth = withAuth(RedeemCreditsPage)
