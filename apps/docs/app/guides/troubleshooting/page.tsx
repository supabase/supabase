import Breadcrumbs from '~/components/Breadcrumbs'
import { TroubleshootingEntries } from '~/features/docs/Troubleshooting.ui'
import {
  TroubleshootingFilter,
  TroubleshootingFilterEmptyState,
  TroubleshootingListController,
} from '~/features/docs/Troubleshooting.ui.client'
import {
  getAllTroubleshootingEntries,
  getAllTroubleshootingErrors,
  getAllTroubleshootingKeywords,
  getAllTroubleshootingProducts,
} from '~/features/docs/Troubleshooting.utils'
import { type TroubleshootingGroupBy } from '~/features/docs/Troubleshooting.utils.shared'
import { SidebarSkeleton } from '~/layouts/MainSkeleton'
import { PROD_URL } from '~/lib/constants'
import { getCustomContent } from '~/lib/custom-content/getCustomContent'
import { type Metadata } from 'next'

const { metadataTitle } = getCustomContent(['metadata:title'])

export default async function GlobalTroubleshootingPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string | string[] }>
}) {
  const troubleshootingEntries = await getAllTroubleshootingEntries()
  const keywords = await getAllTroubleshootingKeywords()
  const products = await getAllTroubleshootingProducts()
  const errors = await getAllTroubleshootingErrors()
  const params = await searchParams
  const groupParam = Array.isArray(params.group) ? params.group[0] : params.group
  const groupBy: TroubleshootingGroupBy = groupParam === 'type' ? 'type' : 'product'

  return (
    <SidebarSkeleton>
      <div className="py-8 px-5 w-full max-w-(--breakpoint-lg) mx-auto">
        <Breadcrumbs className="mb-2" />
        <h1 className="text-4xl tracking-tight mb-7">Diagnosing</h1>
        <p className="text-lg text-foreground-light">
          Search by symptom or error, then group results by product or by health, security,
          performance, or usage.
        </p>
        <hr className="my-7" aria-hidden />
        <TroubleshootingFilter
          keywords={keywords}
          products={products}
          errors={errors}
          enableGroupBy
          className="mb-8"
        />
        <TroubleshootingListController />
        <TroubleshootingFilterEmptyState />
        <TroubleshootingEntries
          name="Supabase"
          entries={troubleshootingEntries}
          groupBy={groupBy}
        />
      </div>
    </SidebarSkeleton>
  )
}

export const metadata: Metadata = {
  title: `${metadataTitle || 'Supabase'} | Diagnosing`,
  alternates: {
    canonical: `${PROD_URL}/guides/troubleshooting`,
  },
}
