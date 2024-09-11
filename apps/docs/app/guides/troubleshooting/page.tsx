import { type Metadata } from 'next'
import { TroubleshootingPreview, TroubleshootingSidebar } from '~/features/docs/Troubleshooting.ui'
import { TroubleshootingFilterEmptyState } from '~/features/docs/Troubleshooting.ui.client'
import {
  getAllTroubleshootingEntries,
  getAllTroubleshootingKeywords,
} from '~/features/docs/Troubleshooting.utils'
import { TROUBLESHOOTING_ENTRIES_ID } from '~/features/docs/Troubleshooting.utils.shared'
import { LayoutMainContent } from '~/layouts/DefaultLayout'
import { SidebarSkeleton } from '~/layouts/MainSkeleton'

export default async function GlobalTroubleshootingPage() {
  const troubleshootingEntries = await getAllTroubleshootingEntries()
  const keywords = await getAllTroubleshootingKeywords()

  return (
    <SidebarSkeleton
      NavigationMenu={<TroubleshootingSidebar keywords={keywords} />}
      menuName="Troubleshooting"
    >
      <LayoutMainContent className="w-full max-w-[80ch]">
        <div id={TROUBLESHOOTING_ENTRIES_ID} className="flex flex-col gap-8 max-w-[80ch]">
          <h2 className="sr-only">Matching topics</h2>
          <TroubleshootingFilterEmptyState />
          {troubleshootingEntries.map((entry) => (
            <TroubleshootingPreview key={entry.data.database_id} entry={entry} />
          ))}
        </div>
      </LayoutMainContent>
    </SidebarSkeleton>
  )
}

export const metadata: Metadata = {
  title: 'Supabase Docs | Troubleshooting',
  alternates: {
    canonical: '/guides/troubleshooting',
  },
}
