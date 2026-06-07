import { useParams } from 'common'
import { PropsWithChildren, ReactNode } from 'react'
import { cn } from 'ui'

import { IntegrationDefinition, INTEGRATIONS } from '../Landing/Integrations.constants'
import { BuiltBySection } from './BuildBySection'
import { MarkdownContent } from './MarkdownContent'
import { RequiredExtensionsSection } from './RequiredExtensionsSection'
import { useDatabaseExtensionsQuery } from '@/data/database-extensions/database-extensions-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

export interface IntegrationOverviewTabProps {
  actions?: ReactNode
  status?: string | ReactNode
  alert?: ReactNode
  hideRequiredExtensionsSection?: boolean
}

export const OverviewTabSharedContent = ({
  integration,
  hideRequiredExtensionsSection = false,
  actions,
  alert,
  children,
}: PropsWithChildren<{
  integration: IntegrationDefinition
  hideRequiredExtensionsSection?: boolean
  actions?: ReactNode
  alert?: ReactNode
}>) => {
  const { data: project } = useSelectedProjectQuery()

  const { data: extensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  if (!integration) {
    return <div>Unsupported integration type</div>
  }

  const installableExtensions = (extensions ?? []).filter((ext) =>
    (integration.requiredExtensions ?? []).includes(ext.name)
  )
  const hasToInstallExtensions = installableExtensions.some((x) => !x.installed_version)

  return (
    <>
      {!!alert && <div className="px-10 max-w-4xl">{alert}</div>}

      <MarkdownContent key={integration.id} integrationId={integration.id} />

      <RequiredExtensionsSection
        hide={hideRequiredExtensionsSection}
        className="px-4 md:px-10 max-w-4xl"
      />

      {!!actions && (
        <div
          aria-disabled={hasToInstallExtensions && !hideRequiredExtensionsSection}
          className={cn(
            'px-10 max-w-4xl',
            hasToInstallExtensions &&
              !hideRequiredExtensionsSection &&
              'opacity-25 [&_button]:pointer-events-none'
          )}
        >
          {actions}
        </div>
      )}
      {children}
    </>
  )
}

export const IntegrationOverviewTab = ({
  actions,
  alert,
  status,
  children,
  hideRequiredExtensionsSection = false,
}: PropsWithChildren<IntegrationOverviewTabProps>) => {
  const { id } = useParams()
  const integration = INTEGRATIONS.find((i) => i.id === id)

  if (!integration) {
    return <div>Unsupported integration type</div>
  }

  return (
    <div className="flex flex-col gap-8 py-10">
      <BuiltBySection integration={integration} status={status} />
      <OverviewTabSharedContent
        integration={integration}
        hideRequiredExtensionsSection={hideRequiredExtensionsSection}
        alert={alert}
        actions={actions}
      >
        {children}
      </OverviewTabSharedContent>
    </div>
  )
}
