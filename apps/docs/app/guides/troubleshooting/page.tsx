import { cn } from 'ui'

import { TroubleshootingPreview } from '~/features/docs/Troubleshooting.ui'
import {
  TroubleshootingFilter,
  TroubleshootingFilterEmptyState,
  TroubleshootingFilterStateProvider,
} from '~/features/docs/Troubleshooting.ui.client'
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
    <SidebarSkeleton hideFooter>
      <LayoutMainContent className="w-full max-w-full h-[calc(100dvh-var(--header-height))] overflow-hidden pb-0 @container">
        <div
          className={cn(
            'w-full max-w-screen-xl mx-auto h-full overflow-hidden px-1',
            'grid gap-8 grid-rows-[min-content,min-content,1fr] grid-cols-[minmax(150px,25%),1fr]',
            '[grid-template-areas:"header_header""filter_filter""main_main"]',
            '@xl:[grid-template-areas:"header_header""filter_main""filter_main"]'
          )}
        >
          <TroubleshootingFilterStateProvider>
            <div className="prose col-span-full [grid-area:header]">
              <h1>Troubleshooting topics</h1>
            </div>
            <TroubleshootingFilter keywords={keywords} className="[grid-area:filter]" />
            <div
              id={TROUBLESHOOTING_ENTRIES_ID}
              className="[grid-area:main] flex flex-col gap-8 overflow-y-auto pb-8"
            >
              <h2 className="sr-only">Matching topics</h2>
              <TroubleshootingFilterEmptyState />
              {troubleshootingEntries.map((entry) => (
                <TroubleshootingPreview key={entry.data.database_id} entry={entry} />
              ))}
            </div>
          </TroubleshootingFilterStateProvider>
        </div>
      </LayoutMainContent>
    </SidebarSkeleton>
  )
}
