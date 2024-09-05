import { TroubleshootingPreview } from '~/features/docs/Troubleshooting.ui'
import {
  TROUBLESHOOTING_ENTRIES_ID,
  TroubleshootingFilter,
} from '~/features/docs/Troubleshooting.ui.client'
import {
  getAllTroubleshootingEntries,
  getAllTroubleshootingKeywords,
} from '~/features/docs/Troubleshooting.utils'
import { LayoutMainContent } from '~/layouts/DefaultLayout'

export default async function GlobalTroubleshootingPage() {
  const troubleshootingEntries = await getAllTroubleshootingEntries()
  const keywords = await getAllTroubleshootingKeywords()

  return (
    <LayoutMainContent className="w-full max-w-full">
      <div className="prose mb-8">
        <h1>Troubleshooting topics</h1>
      </div>
      <div className="grid grid-cols-[min-content,1fr] gap-8">
        <TroubleshootingFilter keywords={keywords} />
        <div id={TROUBLESHOOTING_ENTRIES_ID} className="flex flex-col gap-8">
          {troubleshootingEntries.map((entry) => (
            <TroubleshootingPreview key={entry.data.database_id} entry={entry} />
          ))}
        </div>
      </div>
    </LayoutMainContent>
  )
}
