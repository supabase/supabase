import { EnvironmentVariablesPage } from 'components/interfaces/EnvironmentVariables/EnvironmentVariablesPage'
import { DefaultLayout } from 'components/layouts/DefaultLayout'
import { ProjectLayout } from 'components/layouts/ProjectLayout'
import { useEnvVarBindings } from 'hooks/misc/useEnvVarBindings'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import type { NextPageWithLayout } from 'types'
import { Toggle } from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

const EnvironmentVariablesPageEntry: NextPageWithLayout = () => {
  const router = useRouter()
  const { data: project } = useSelectedProjectQuery()
  const { enabled, setEnabled } = useEnvVarBindings()

  useEffect(() => {
    if (project?.parent_project_ref) {
      router.replace(`/project/${project.parent_project_ref}/environment-variables`)
    }
  }, [project, router])

  if (project?.parent_project_ref) return null

  return (
    <>
      <PageHeader>
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Environment Variables</PageHeaderTitle>
            <PageHeaderDescription>
              Manage environment variables and secrets for your project
            </PageHeaderDescription>
          </PageHeaderSummary>
          {/* TODO: temporary dev toggle — remove once env var bindings are stable */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground-light">Env var bindings</span>
            <Toggle checked={enabled} onChange={(v) => setEnabled(v)} size="tiny" />
          </div>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer>
        <EnvironmentVariablesPage />
      </PageContainer>
    </>
  )
}

EnvironmentVariablesPageEntry.getLayout = (page) => (
  <DefaultLayout>
    <ProjectLayout>{page}</ProjectLayout>
  </DefaultLayout>
)

export default EnvironmentVariablesPageEntry
