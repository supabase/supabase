import { useParams } from 'common'
import Head from 'next/head'

import { JitDbAccessInvite } from '@/components/interfaces/JitDbAccessInvite/JitDbAccessInvite'
import { OrganizationInvite } from '@/components/interfaces/OrganizationInvite/OrganizationInvite'
import { buildStudioPageTitle } from '@/lib/page-title'
import type { NextPageWithLayout } from '@/types'

const ORG_INVITE_TITLE = buildStudioPageTitle({
  section: 'Join Organization',
  brand: 'Supabase',
})
const JIT_INVITE_TITLE = buildStudioPageTitle({
  section: 'Accept temporary access',
  brand: 'Supabase',
})

const JoinPage: NextPageWithLayout = () => {
  const { type } = useParams()
  const isJitInvite = type === 'temporary-access'

  return (
    <>
      <Head>
        <title>{isJitInvite ? JIT_INVITE_TITLE : ORG_INVITE_TITLE}</title>
      </Head>
      {isJitInvite ? <JitDbAccessInvite /> : <OrganizationInvite />}
    </>
  )
}

export default JoinPage
