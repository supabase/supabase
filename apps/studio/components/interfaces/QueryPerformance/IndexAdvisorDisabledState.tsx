import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useDatabaseExtensionEnableMutation } from 'data/database-extensions/database-extension-enable-mutation'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button } from 'ui'
import { Markdown } from '../Markdown'

export const IndexAdvisorDisabledState = () => {
  const { ref } = useParams()
  const { project } = useProjectContext()
  const { data: extensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const hypopgExtension = (extensions ?? []).find((ext) => ext.name === 'hypopg')
  const indexAdvisorExtension = (extensions ?? []).find((ext) => ext.name === 'index_advisor')

  const { mutateAsync: enableExtension, isLoading: isEnablingExtension } =
    useDatabaseExtensionEnableMutation()

  const onEnableIndexAdvisor = async () => {
    if (project === undefined) return console.error('Project is required')

    try {
      if (hypopgExtension?.installed_version === null) {
        await enableExtension({
          projectRef: project?.ref,
          connectionString: project?.connectionString,
          name: hypopgExtension.name,
          schema: hypopgExtension?.schema ?? 'extensions',
          version: hypopgExtension.default_version,
        })
      }
      if (indexAdvisorExtension?.installed_version === null) {
        await enableExtension({
          projectRef: project?.ref,
          connectionString: project?.connectionString,
          name: indexAdvisorExtension.name,
          schema: indexAdvisorExtension?.schema ?? 'extensions',
          version: indexAdvisorExtension.default_version,
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
            indexAdvisorExtension === undefined
              ? 'Newer version of Postgres required'
              : 'Postgres extensions `index_advisor` and `hypopg` required'
          }
        />
      </AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_>
        <Markdown
          content={
            indexAdvisorExtension === undefined
              ? 'Upgrade to the latest version of Postgres to get recommendations on indexes for your queries'
              : 'These extensions can help in recommending database indexes to reduce the costs of your query.'
          }
        />
      </AlertDescription_Shadcn_>

      <AlertDescription_Shadcn_ className="mt-3">
        <div className="flex items-center gap-x-2">
          {indexAdvisorExtension === undefined ? (
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
          <Button asChild type="outline" icon={<ExternalLink />}>
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
