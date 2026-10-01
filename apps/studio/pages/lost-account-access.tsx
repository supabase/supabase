import Head from 'next/head'

import { ACCOUNT_RECOVERY_HEADER_TITLE } from '@/components/interfaces/SignIn/AccountRecovery.constants'
import { LostAccountAccessFormWizard } from '@/components/interfaces/SignIn/LostAccountAccessForm'
import { StandaloneFormPageLayout } from '@/components/layouts/StandaloneFormPageLayout'
import { useCustomContent } from '@/hooks/custom-content/useCustomContent'
import { buildStudioPageTitle } from '@/lib/page-title'
import type { NextPageWithLayout } from '@/types'

const LostAccountAccess: NextPageWithLayout = () => {
  const { appTitle } = useCustomContent(['app:title'])
  const pageTitle = buildStudioPageTitle({
    section: 'Request Account Recovery',
    brand: appTitle || 'Supabase',
  })

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <LostAccountAccessFormWizard />
    </>
  )
}

LostAccountAccess.getLayout = (page) => (
  <StandaloneFormPageLayout title={ACCOUNT_RECOVERY_HEADER_TITLE}>{page}</StandaloneFormPageLayout>
)

export default LostAccountAccess
