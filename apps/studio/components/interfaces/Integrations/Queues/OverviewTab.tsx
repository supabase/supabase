import { useParams } from 'common'
import Link from 'next/link'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns'

import { IntegrationOverviewTab } from '../Integration/IntegrationOverviewTab'
import { RequiredExtensionsSection } from '../Integration/RequiredExtensionsSection'
import { useIsMarketplaceEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useDatabaseExtensionsQuery } from '@/data/database-extensions/database-extensions-query'
import { useQueuesExposePostgrestStatusQuery } from '@/data/database-queues/database-queues-expose-postgrest-status-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

const QueuesContent = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: isExposed } = useQueuesExposePostgrestStatusQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { data: extensions = [] } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const isQueuesInstalled = !!extensions.find((x) => x.name === 'pgmq')?.installed_version

  if (isExposed) return null

  return (
    <Admonition
      type="default"
      title="Queues can be managed via any Supabase client library or PostgREST endpoints"
    >
      <p>
        You may choose to toggle the exposure of Queues through Data APIs via the queues settings
      </p>

      {isQueuesInstalled && (
        <Button asChild type="default" className="mt-2">
          <Link href={`/project/${ref}/integrations/queues/settings`}>Manage queues settings</Link>
        </Button>
      )}
    </Admonition>
  )
}

export const QueuesOverviewTab = () => {
  const isMarketplaceEnabled = useIsMarketplaceEnabled()

  if (isMarketplaceEnabled) return <RequiredExtensionsSection />
  return <IntegrationOverviewTab actions={<QueuesContent />} />
}
