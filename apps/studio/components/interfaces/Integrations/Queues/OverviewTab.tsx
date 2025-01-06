import { useParams } from 'common'
import { useQueuesExposePostgrestStatusQuery } from 'data/database-queues/database-queues-expose-postgrest-status-query'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import Link from 'next/link'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns'
import { IntegrationOverviewTab } from '../Integration/IntegrationOverviewTab'

export const QueuesOverviewTab = () => {
  const { ref } = useParams()
  const project = useSelectedProject()

  const { data: isExposed } = useQueuesExposePostgrestStatusQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  return (
    <IntegrationOverviewTab
      actions={
        !isExposed ? (
          <Admonition
            type="default"
            title="Queues can be managed via any Supabase client library or PostgREST endpoints"
          >
            <p>
              You may choose to toggle the exposure of Queues through Data APIs via the queues
              settings
            </p>
            <Button asChild type="default">
              <Link href={`/project/${ref}/integrations/queues/settings`}>
                Manage queues settings
              </Link>
            </Button>
          </Admonition>
        ) : null
      }
    />
  )
}
