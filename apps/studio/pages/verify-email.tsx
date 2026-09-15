import Head from 'next/head'

import { SupportEmailVerification } from '@/components/interfaces/SupportEmailVerification/SupportEmailVerification'
import { buildStudioPageTitle } from '@/lib/page-title'
import type { NextPageWithLayout } from '@/types'

const PAGE_TITLE = buildStudioPageTitle({ section: 'Email Verification', brand: 'Supabase' })

const VerifyEmailPage: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>{PAGE_TITLE}</title>
      </Head>
      <SupportEmailVerification />
    </>
  )
}

export default VerifyEmailPage
