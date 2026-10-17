import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { CsatSurvey } from '@/components/interfaces/Support/CsatSurvey/CsatSurvey'
import { IS_PLATFORM } from '@/lib/constants'
import { buildStudioPageTitle } from '@/lib/page-title'
import type { NextPageWithLayout } from '@/types'

const PAGE_TITLE = buildStudioPageTitle({
  section: 'Customer Satisfaction Survey',
  brand: 'Supabase',
})

/**
 * Pre-auth page: customers land here from the satisfaction survey link in a resolved
 * support ticket email, so there may be no dashboard session. Hosted platform only.
 */
const CsatSurveyPage: NextPageWithLayout = () => {
  const router = useRouter()

  useEffect(() => {
    if (!IS_PLATFORM) {
      router.replace('/404')
    }
  }, [router])

  if (!IS_PLATFORM) {
    return null
  }

  return (
    <>
      <Head>
        <title>{PAGE_TITLE}</title>
      </Head>
      <CsatSurvey />
    </>
  )
}

export default CsatSurveyPage
