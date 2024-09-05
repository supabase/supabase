import { getAllTroubleshootingEntries } from './Troubleshooting.utils'

export function TroubleshootingEntry({
  entry,
}: {
  entry: Awaited<ReturnType<typeof getAllTroubleshootingEntries>>[number]
}) {
  return <article>{entry.data.title}</article>
}
