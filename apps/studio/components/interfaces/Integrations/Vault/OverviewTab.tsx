import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { IntegrationOverviewTab } from '../Integration/IntegrationOverviewTab'
import { MissingExtensionAlert } from '../Integration/MissingExtensionAlert'
import { INTEGRATIONS } from '../Landing/Integrations.constants'

export const VaultOverviewTab = () => {
  const { project } = useProjectContext()

  const integration = INTEGRATIONS.find((i) => i.id === 'vault')

  const { data: extensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  if (!integration || integration.type !== 'postgres_extension') {
    return <div>Unsupported integration type.</div>
  }

  const neededExtensions = (extensions ?? []).filter((ext) =>
    integration.requiredExtensions.includes(ext.name)
  )

  return (
    <IntegrationOverviewTab
      integration={integration}
      actions={neededExtensions.map((extension) => (
        <MissingExtensionAlert extension={extension} />
      ))}
    ></IntegrationOverviewTab>
  )
}
