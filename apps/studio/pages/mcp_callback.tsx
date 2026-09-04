import Head from 'next/head'

import { McpElicitation } from '@/components/interfaces/McpElicitation/McpElicitation'
import { withAuth } from '@/hooks/misc/withAuth'
import { buildStudioPageTitle } from '@/lib/page-title'
import type { NextPageWithLayout } from '@/types'

const PAGE_TITLE = buildStudioPageTitle({ section: 'Store an API key', brand: 'Supabase' })

const McpCallbackPage: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>{PAGE_TITLE}</title>
      </Head>
      <McpElicitation />
    </>
  )
}

export default withAuth(McpCallbackPage)
