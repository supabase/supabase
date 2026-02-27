import { useParams } from 'common'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { PropsWithChildren, ReactNode } from 'react'
import { Badge, Card, CardContent, cn, Separator } from 'ui'

import { INTEGRATIONS } from '../Landing/Integrations.constants'
import { BuiltBySection } from './BuildBySection'
import { MarkdownContent } from './MarkdownContent'
import { MissingExtensionAlert } from './MissingExtensionAlert'

interface IntegrationOverviewTabProps {
  actions?: ReactNode
  status?: string | ReactNode
  alert?: ReactNode
}

export const IntegrationOverviewTab = ({
  actions,
  alert,
  status,
  children,
}: PropsWithChildren<IntegrationOverviewTabProps>) => {
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
  const hasToInstallExtensions = installableExtensions.some((x) => !x.installed_version)

  // The integration requires extensions that are not available to install on the current database image
  const hasMissingExtensions =
    installableExtensions.length !== integration.requiredExtensions.length

  return (
    <div className="flex flex-col gap-8 py-10">
      <BuiltBySection integration={integration} status={status} />
      {alert && <div className="px-10 max-w-4xl">{alert}</div>}
      <MarkdownContent key={integration.id} integrationId={integration.id} />
      <Separator />
      {dependsOnExtension && (
        <div className="px-4 md:px-10 max-w-4xl flex flex-col gap-y-4">
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
                      className={[
                        'flex items-center justify-between gap-3 py-2 px-3',
                        !isLastRow ? 'border-b' : '',
                      ].join(' ')}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="truncate">
                          <code>{requiredExtension}</code>
                        </span>
                      </div>

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
      {!!actions && (
        <div
          aria-disabled={hasToInstallExtensions}
          className={cn(
            'px-10 max-w-4xl',
            hasToInstallExtensions && 'opacity-25 [&_button]:pointer-events-none'
          )}
        >
          {actions}
        </div>
      )}
      {children}
    </div>
  )
}
