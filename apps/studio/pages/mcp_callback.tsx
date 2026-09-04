import Head from 'next/head'

import { McpElicitation } from '@/components/interfaces/McpElicitation/McpElicitation'
import { withAuth } from '@/hooks/misc/withAuth'
import { buildStudioPageTitle } from '@/lib/page-title'
import type { NextPageWithLayout } from '@/types'

const PAGE_TITLE = buildStudioPageTitle({ section: 'Store an API key', brand: 'Supabase' })

/** No `getLayout` — this route renders standalone, without the dashboard shell. */
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

/**
 * The page reads project details and writes a secret, so it needs a session at
 * the highest AAL — the platform API rejects anything less.
 *
 * `withAuth` puts the bare pathname in `returnTo` and leaves `ref`/`name`
 * alongside it, which is what `getReturnToPath` expects: `validateReturnTo`
 * restricts the charset of `returnTo` itself and would drop an embedded query
 * string. It adds no layout chrome of its own, so the route stays standalone.
 */
export default withAuth(McpCallbackPage)
