import { Badge, Card, CardContent, cn, Separator } from 'ui'

import { useIsMarketplaceEnabled } from '../../App/FeaturePreview/FeaturePreviewContext'
import { MissingExtensionAlert } from './MissingExtensionAlert'
import { useIntegrationDetail } from '@/components/interfaces/Integrations/Landing/useIntegrationDetail'
import { useDatabaseExtensionsQuery } from '@/data/database-extensions/database-extensions-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

export const RequiredExtensionsSection = ({
  hide = false,
  hideSeparator = false,
  className,
}: {
  hide?: boolean
  hideSeparator?: boolean
  className?: string
}) => {
  const { integration } = useIntegrationDetail()
  const { data: project } = useSelectedProjectQuery()
  const { data: extensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const isMarketplaceEnabled = useIsMarketplaceEnabled()

  const requiredExtensions = integration?.requiredExtensions ?? []

  if (hide || requiredExtensions.length === 0) return null

  const installableExtensions = (extensions ?? []).filter((ext) =>
    requiredExtensions.includes(ext.name)
  )
  const hasMissingExtensions = installableExtensions.length !== requiredExtensions.length

  return (
    <>
      {!hideSeparator && <Separator />}
      <div className={cn('flex flex-col gap-y-4', className)}>
        <h4>Required extensions</h4>
        <Card>
          <CardContent className="p-0">
            <ul className="text-foreground-light text-sm">
              {requiredExtensions.map((requiredExtension, idx) => {
                const extension = (extensions ?? []).find((ext) => ext.name === requiredExtension)
                const isInstalled = !!extension?.installed_version
                const isLastRow = idx === requiredExtensions.length - 1

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
                          <Badge variant="secondary">Installed</Badge>
                        ) : isMarketplaceEnabled ? (
                          <Badge variant="warning">Required</Badge>
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

            {hasMissingExtensions && integration?.missingExtensionsAlert && (
              <div className="py-3 px-4 border-t">{integration.missingExtensionsAlert}</div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
