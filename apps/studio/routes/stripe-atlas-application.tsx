import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

import { StripeAtlasApplicationScreen } from '@/components/interfaces/StripeAtlasApplication/StripeAtlasApplication'
import { IS_PLATFORM } from '@/lib/constants'
import { buildStudioPageTitle } from '@/lib/page-title'

export const Route = createFileRoute('/stripe-atlas-application')({
  component: StripeAtlasApplicationPage,
})

const PAGE_TITLE = buildStudioPageTitle({ section: 'Stripe Atlas Application', brand: 'Supabase' })

/**
 * Page needs to be pre-auth – customers will be redirected here from the
 * Stripe Atlas dashboard, either directly via a static link or via a callbackURL from the mgmt API.
 * The user's auth state doesn't matter for the application; what matters is the the query params of the callbackURL.
 *
 * Only available on the hosted platform – self-hosted Studio routes to 404.
 */
function StripeAtlasApplicationPage() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!IS_PLATFORM) {
      void navigate({ href: '/404', replace: true })
    }
  }, [navigate])

  if (!IS_PLATFORM) {
    return null
  }

  return (
    <>
      <title>{PAGE_TITLE}</title>
      <StripeAtlasApplicationScreen />
    </>
  )
}
