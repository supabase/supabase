import { ExternalLink } from 'lucide-react'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useDatabaseExtensionEnableMutation } from 'data/database-extensions/database-extension-enable-mutation'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useIndexAdvisorEnableMutation } from 'data/database/index-advisor-enable-mutation'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button } from 'ui'
import { Markdown } from '../Markdown'

export const IndexAdvisorDisabledState = () => {
  const { project } = useProjectContext()
  const { data: extensions } = useDatabaseExtensionsQuery({
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
    <Alert_Shadcn_>
      <AlertTitle_Shadcn_>
        Get index suggestions to improve your query performance
      </AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_>
        <Markdown content="The `index_advisor` extension can help in recommending database indexes to reduce the costs of your query." />
      </AlertDescription_Shadcn_>
      <AlertDescription_Shadcn_ className="mt-3">
        <div className="flex items-center gap-x-2">
          <Button
            type="default"
            disabled={isEnabling}
            loading={isEnabling}
            onClick={() => onEnableIndexAdvisor()}
          >
            Enable index advisor
          </Button>
          <Button asChild type="default" icon={<ExternalLink />}>
            <a
              target="_blank"
              rel="noreferrer"
              href="https://supabase.com/docs/guides/database/extensions/index_advisor"
            >
              Documentation
            </a>
          </Button>
        </div>
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}
