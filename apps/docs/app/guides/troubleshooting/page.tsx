import { type Metadata } from 'next'

import { TroubleshootingPreview } from '~/features/docs/Troubleshooting.ui'
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
import { TROUBLESHOOTING_CONTAINER_ID } from '~/features/docs/Troubleshooting.utils.shared'
import { SidebarSkeleton } from '~/layouts/MainSkeleton'
import { PROD_URL } from '~/lib/constants'

// 60 seconds/minute * 60 minutes/hour * 24 hours/day
export const revalidate = 86_400

export default async function GlobalTroubleshootingPage() {
  const troubleshootingEntries = await getAllTroubleshootingEntries()
  const keywords = await getAllTroubleshootingKeywords()
  const products = await getAllTroubleshootingProducts()
  const errors = await getAllTroubleshootingErrors()

  return (
    <SidebarSkeleton hideSideNav className="w-full max-w-screen-lg mx-auto">
      <div className="py-8 px-5">
        <h1 className="text-4xl tracking-tight mb-7">Troubleshooting</h1>
        <p className="text-lg text-foreground-light">
          Search or browse our troubleshooting guides for solutions to common Supabase issues.
        </p>
        <hr className="my-7" aria-hidden />
        <TroubleshootingFilter
          keywords={keywords}
          products={products}
          errors={errors}
          className="mb-8"
        />
        <TroubleshootingListController />
        <TroubleshootingFilterEmptyState />
        <div id={TROUBLESHOOTING_CONTAINER_ID}>
          <h2 className="sr-only">Matching troubleshooting entries</h2>
          <ul>
            {troubleshootingEntries.map((entry) => (
              <li key={entry.data.database_id}>
                <TroubleshootingPreview entry={entry} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SidebarSkeleton>
  )
}

export const metadata: Metadata = {
  title: 'Supabase Docs | Troubleshooting',
  alternates: {
    canonical: `${PROD_URL}/guides/troubleshooting`,
  },
}
