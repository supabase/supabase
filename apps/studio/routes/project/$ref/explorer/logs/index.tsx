import { createFileRoute } from '@tanstack/react-router'

import { ExplorerLogsTab } from '@/components/interfaces/Explorer/ExplorerLogsTab'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

export const Route = createFileRoute('/project/$ref/explorer/logs/')({
  component: ExplorerLogsRoute,
})

function ExplorerLogsRoute() {
  const { ref } = Route.useParams()
  const isLogsEnabled = useIsFeatureEnabled('logs:all')

  if (!isLogsEnabled) return <UnknownInterface urlBack={`/project/${ref}/explorer`} />

  return <ExplorerLogsTab />
}
