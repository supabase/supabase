import { useParams } from 'common'
import Link from 'next/link'
import { Badge, Button, Card, CardContent, cn, Separator } from 'ui'
import { Admonition } from 'ui-patterns'

import { IntegrationOverviewTab } from '../Integration/IntegrationOverviewTab'
import { MissingExtensionAlert } from '../Integration/MissingExtensionAlert'
import { INTEGRATIONS } from '../Landing/Integrations.constants'
import { useIsMarketplaceEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useDatabaseExtensionsQuery } from '@/data/database-extensions/database-extensions-query'
import { useQueuesExposePostgrestStatusQuery } from '@/data/database-queues/database-queues-expose-postgrest-status-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

const QueuesCustomContent = () => {
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

export const QueuesContent = () => {
  const { id } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const integration = INTEGRATIONS.find((i) => i.id === id)
  const { data: extensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  if (!integration) {
    return <div>Unsupported integration type</div>
  }

  const dependsOnExtension = (integration.requiredExtensions ?? []).length > 0
  const installableExtensions = (extensions ?? []).filter((ext) =>
    (integration.requiredExtensions ?? []).includes(ext.name)
  )
  const hasMissingExtensions =
    installableExtensions.length !== integration.requiredExtensions.length

  return (
    <>
      <Separator />
      {dependsOnExtension && (
        <div className="flex flex-col gap-y-4">
          <h4>Required extensions</h4>
          <Card>
            <CardContent className="p-0">
              <ul className="text-foreground-light text-sm">
                {(integration.requiredExtensions ?? []).map((requiredExtension, idx) => {
                  const extension = (extensions ?? []).find((ext) => ext.name === requiredExtension)
                  const isInstalled = !!extension?.installed_version
                  const isLastRow = idx === (integration.requiredExtensions?.length ?? 0) - 1

                  return (
                    <li
                      key={requiredExtension}
                      className={cn(
                        'flex items-center justify-between gap-3 py-2 px-3',
                        !isLastRow ? 'border-b' : ''
                      )}
                    >
                      <code className="text-xs">{requiredExtension}</code>

                      <div className="shrink-0">
                        {extension ? (
                          isInstalled ? (
                            <Badge>Installed</Badge>
                          ) : (
                            <MissingExtensionAlert extension={extension} />
                          )
                        ) : (
                          <span className="text-foreground-muted">Unavailable</span>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>

              {hasMissingExtensions && (
                <div className="py-3 px-4 border-t">{integration.missingExtensionsAlert}</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      <QueuesCustomContent />
    </>
  )
}

export const QueuesOverviewTab = () => {
  const isMarketplaceEnabled = useIsMarketplaceEnabled()

  if (isMarketplaceEnabled) {
    return <QueuesContent />
  }

  return <IntegrationOverviewTab actions={<QueuesCustomContent />} />
}
