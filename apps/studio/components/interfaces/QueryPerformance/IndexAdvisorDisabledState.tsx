import Link from 'next/link'
import { toast } from 'sonner'

import { useParams } from 'common'
import { DocsButton } from 'components/ui/DocsButton'
import { useDatabaseExtensionEnableMutation } from 'data/database-extensions/database-extension-enable-mutation'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button } from 'ui'
import { Markdown } from '../Markdown'
import { getIndexAdvisorExtensions } from './index-advisor.utils'

export const IndexAdvisorDisabledState = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: extensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { hypopg, indexAdvisor } = getIndexAdvisorExtensions(extensions)

  const { mutateAsync: enableExtension, isLoading: isEnablingExtension } =
    useDatabaseExtensionEnableMutation()

  const onEnableIndexAdvisor = async () => {
    if (project === undefined) return console.error('Project is required')

    try {
      if (hypopg?.installed_version === null) {
        await enableExtension({
          projectRef: project?.ref,
          connectionString: project?.connectionString,
          name: hypopg.name,
          schema: hypopg?.schema ?? 'extensions',
          version: hypopg.default_version,
        })
      }
      if (indexAdvisor?.installed_version === null) {
        await enableExtension({
          projectRef: project?.ref,
          connectionString: project?.connectionString,
          name: indexAdvisor.name,
          schema: indexAdvisor?.schema ?? 'extensions',
          version: indexAdvisor.default_version,
        })
      }
      toast.success('Successfully enabled index advisor!')
    } catch (error: any) {
      toast.error(`Failed to enable index advisor: ${error.message}`)
    }
  }

  return (
    <Alert_Shadcn_ className="mb-6">
      <AlertTitle_Shadcn_>
        <Markdown
          className="text-foreground"
          content={
            indexAdvisor === undefined
              ? 'Newer version of Postgres required'
              : 'Postgres extensions `index_advisor` and `hypopg` required'
          }
        />
      </AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_>
        <Markdown
          content={
            indexAdvisor === undefined
              ? 'Upgrade to the latest version of Postgres to get recommendations on indexes for your queries'
              : 'These extensions can help in recommending database indexes to reduce the costs of your query.'
          }
        />
      </AlertDescription_Shadcn_>

      <AlertDescription_Shadcn_ className="mt-3">
        <div className="flex items-center gap-x-2">
          {indexAdvisor === undefined ? (
            <Button asChild type="default">
              <Link href={`/project/${ref}/settings/infrastructure`}>Upgrade Postgres version</Link>
            </Button>
          ) : (
            <Button
              type="default"
              disabled={isEnablingExtension}
              loading={isEnablingExtension}
              onClick={() => onEnableIndexAdvisor()}
            >
              Enable extensions
            </Button>
          )}
          <DocsButton href={`${DOCS_URL}/guides/database/extensions/index_advisor`} />
        </div>
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}
