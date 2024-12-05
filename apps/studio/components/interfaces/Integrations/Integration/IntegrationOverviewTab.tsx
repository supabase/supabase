import { useRouter } from 'next/router'
import { PropsWithChildren, ReactNode } from 'react'

import { useParams } from 'common'
import { Markdown } from 'components/interfaces/Markdown'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { Badge, Separator } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { INTEGRATIONS } from '../Landing/Integrations.constants'
import { BuiltBySection } from './BuildBySection'
import { MarkdownContent } from './MarkdownContent'
import { MissingExtensionAlert } from './MissingExtensionAlert'

interface IntegrationOverviewTabProps {
  actions?: ReactNode
}

export const IntegrationOverviewTab = ({
  actions,
  children,
}: PropsWithChildren<IntegrationOverviewTabProps>) => {
  const { id } = useParams()
  const router = useRouter()
  const project = useSelectedProject()

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
      <BuiltBySection integration={integration} />
      {dependsOnExtension && (
        <div className="px-10 max-w-4xl">
          <Admonition
            showIcon={false}
            type="default"
            className="[&>div]:flex [&>div]:flex-col [&>div]:gap-y-2"
          >
            <Badge className="bg-surface-300 bg-opacity-100 flex items-center gap-x-2 w-max">
              <img
                alt="Supabase"
                src={`${router.basePath}/img/supabase-logo.svg`}
                className=" h-2.5 cursor-pointer rounded"
              />
              <span>Postgres Module</span>
            </Badge>
            <Markdown
              className="max-w-full"
              content={`This integration uses the ${integration.requiredExtensions.map((x) => `\`${x}\``).join(', ')}
              extension${integration.requiredExtensions.length > 1 ? 's' : ''} directly in your Postgres database.
              ${hasToInstallExtensions && !hasMissingExtensions ? `Install ${integration.requiredExtensions.length > 1 ? 'these' : 'this'} database extension${integration.requiredExtensions.length > 1 ? 's' : ''} to use ${integration.name} in your project.` : ''}
              `}
            />

            {hasMissingExtensions ? (
              integration.missingExtensionsAlert
            ) : (
              <div className="flex flex-row gap-x-2">
                {installableExtensions.map((extension) => (
                  <MissingExtensionAlert key={extension.name} extension={extension} />
                ))}
              </div>
            )}
          </Admonition>
        </div>
      )}
      {!!actions && !hasToInstallExtensions && <div className="px-10 max-w-4xl">{actions}</div>}
      <MarkdownContent key={integration.id} integrationId={integration.id} />
      <Separator />
      {children}
    </div>
  )
}
