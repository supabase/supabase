import { TroubleshootingPreview } from '~/features/docs/Troubleshooting.ui'
import { getAllTroubleshootingEntries } from '~/features/docs/Troubleshooting.utils'
import { LayoutMainContent } from '~/layouts/DefaultLayout'

export default async function GlobalTroubleshootingPage() {
  const troubleshootingEntries = await getAllTroubleshootingEntries()

  return (
    <LayoutMainContent className="w-full max-w-full">
      {troubleshootingEntries.map((entry) => (
        <TroubleshootingPreview key={entry.data.database_id} entry={entry} />
      ))}
    </LayoutMainContent>
  )
}
