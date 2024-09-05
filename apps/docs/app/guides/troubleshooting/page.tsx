import { TroubleshootingEntry } from '~/features/docs/Troubleshooting.ui'
import { getAllTroubleshootingEntries } from '~/features/docs/Troubleshooting.utils'

export default async function GlobalTroubleshootingPage() {
  const troubleshootingEntries = await getAllTroubleshootingEntries()

  return (
    <>
      {troubleshootingEntries.map((entry) => (
        <TroubleshootingEntry key={entry.data.database_id} entry={entry} />
      ))}
    </>
  )
}
