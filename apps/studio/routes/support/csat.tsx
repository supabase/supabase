import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

import { CsatSurvey } from '@/components/interfaces/Support/CsatSurvey/CsatSurvey'
import { IS_PLATFORM } from '@/lib/constants'
import { buildStudioPageTitle } from '@/lib/page-title'

export const Route = createFileRoute('/support/csat')({
  component: CsatSurveyPage,
})

const PAGE_TITLE = buildStudioPageTitle({
  section: 'Customer Satisfaction Survey',
  brand: 'Supabase',
})

/**
 * Pre-auth page: customers land here from the satisfaction survey link in a resolved
 * support ticket email, so there may be no dashboard session. Hosted platform only.
 */
function CsatSurveyPage() {
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
      <CsatSurvey />
    </>
  )
}
