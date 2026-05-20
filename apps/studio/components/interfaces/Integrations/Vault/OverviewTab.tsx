import { useParams } from 'common'
import { Badge, Card, CardContent, cn, Separator } from 'ui'

import { BuiltBySection } from '../Integration/BuildBySection'
import { IntegrationOverviewTab } from '../Integration/IntegrationOverviewTab'
import { MissingExtensionAlert } from '../Integration/MissingExtensionAlert'
import { INTEGRATIONS } from '../Landing/Integrations.constants'
import { useIsMarketplaceEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useDatabaseExtensionsQuery } from '@/data/database-extensions/database-extensions-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

const VaultOverviewContent = () => {
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
    </>
  )
}

export const VaultOverviewTab = () => {
  const isMarketplaceEnabled = useIsMarketplaceEnabled()

  if (isMarketplaceEnabled) {
    return <VaultOverviewContent />
  }

  return (
    <IntegrationOverviewTab>
      <VaultOverviewContent />
    </IntegrationOverviewTab>
  )
}
