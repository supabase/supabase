import Head from 'next/head'

import { McpSecrets } from '@/components/interfaces/MCP/Secrets/McpSecrets'
import { withAuth } from '@/hooks/misc/withAuth'
import { buildStudioPageTitle } from '@/lib/page-title'
import type { NextPageWithLayout } from '@/types'

const PAGE_TITLE = buildStudioPageTitle({ section: 'Store an API key', brand: 'Supabase' })

const McpSecretsPage: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>{PAGE_TITLE}</title>
      </Head>
      <McpSecrets />
    </>
  )
}

export default withAuth(McpSecretsPage)
