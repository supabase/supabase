import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useDatabaseExtensionEnableMutation } from 'data/database-extensions/database-extension-enable-mutation'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useIndexAdvisorEnableMutation } from 'data/database/index-advisor-enable-mutation'
import { Button } from 'ui'

export const IndexAdvisorDisabledState = () => {
  const { project } = useProjectContext()
  const { data: extensions, isLoading: isLoadingExtensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const hypopgExtension = (extensions ?? []).find((ext) => ext.name === 'hypopg')

  const { mutateAsync: enableExtension, isLoading: isEnablingExtension } =
    useDatabaseExtensionEnableMutation()
  const { mutateAsync: enableIndexAdvisor, isLoading: isEnablingIndexAdvisor } =
    useIndexAdvisorEnableMutation()
  const isEnabling = isEnablingExtension || isEnablingIndexAdvisor

  const onEnableIndexAdvisor = async () => {
    if (project === undefined) return console.error('Project is required')
    if (hypopgExtension?.installed_version === null) {
      await enableExtension({
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        name: hypopgExtension.name,
        schema: hypopgExtension?.schema ?? 'extensions',
        version: hypopgExtension.default_version,
      })
    }

    // [Joshen] Once index_advisor ext is ready, it'll just be enabling an extension
    await enableIndexAdvisor({
      projectRef: project.ref,
      connectionString: project.connectionString,
    })
  }

  return (
    <div className="border rounded-md p-2">
      <Button type="default" onClick={() => onEnableIndexAdvisor()}>
        Enable index advisor
      </Button>
    </div>
  )
}
