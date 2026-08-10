import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { Switch } from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

import { EnvironmentVariablesPage } from '@/components/interfaces/EnvironmentVariables/EnvironmentVariablesPage'
import BranchLayout from '@/components/layouts/BranchLayout/BranchLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { useEnvVarBindings } from '@/hooks/misc/useEnvVarBindings'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import type { NextPageWithLayout } from '@/types'

const EnvironmentVariablesPageEntry: NextPageWithLayout = () => {
  const router = useRouter()
  const { data: project } = useSelectedProjectQuery()
  const { enabled, setEnabled } = useEnvVarBindings()

  useEffect(() => {
    if (project?.parent_project_ref) {
      router.replace(`/project/${project.parent_project_ref}/branches/environment-variables`)
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
            <Switch checked={enabled} onCheckedChange={setEnabled} />
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
    <BranchLayout>{page}</BranchLayout>
  </DefaultLayout>
)

export default EnvironmentVariablesPageEntry
