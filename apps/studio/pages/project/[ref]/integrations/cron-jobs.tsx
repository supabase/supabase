import { INTEGRATIONS } from 'components/interfaces/Integrations/Landing/Integrations.constants'
import { IntegrationWrapper } from 'components/interfaces/Integrations/Landing/IntegrationWrapper'
import { CronjobsTab } from 'components/interfaces/Integrations/NewCronJobs/CronjobsTab'
import { CronjobsOverviewTab } from 'components/interfaces/Integrations/NewCronJobs/OverviewTab'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import ProjectLayout from 'components/layouts/ProjectLayout/ProjectLayout'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useMemo } from 'react'
import type { NextPageWithLayout } from 'types'

const tabs = [
  {
    id: 'overview',
    label: 'Overview',
    content: (
      <div className="p-9">
        <CronjobsOverviewTab />
      </div>
    ),
  },
  {
    id: 'cronjobs',
    label: 'Cronjobs',
    content: (
      <div className="p-9">
        <CronjobsTab />
      </div>
    ),
  },
]

const CronJobsPage: NextPageWithLayout = () => {
  const id = 'supabase-cron'

  const integration = INTEGRATIONS.find((i) => i.id === id)

  const { project } = useProjectContext()

  const { data: extensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const pgCronExtension = (extensions ?? []).find((ext) => ext.name === 'pg_cron')
  const pgCronExtensionInstalled = !!pgCronExtension?.installed_version

  const tabs = useMemo(() => {
    return [
      {
        id: 'overview',
        label: 'Overview',
        content: (
          <div className="p-9">
            <CronjobsOverviewTab />
          </div>
        ),
      },
      ...(pgCronExtensionInstalled
        ? [
            {
              id: 'cronjobs',
              label: 'Cronjobs',
              content: (
                <div className="p-9">
                  <CronjobsTab />
                </div>
              ),
            },
          ]
        : []),
    ]
  }, [pgCronExtensionInstalled])

  if (!integration) {
    return null
  }

  return <IntegrationWrapper integration={integration} tabs={tabs} />
}

CronJobsPage.getLayout = (page) => {
  return (
    <ProjectLayout title="Integrations" product="Integrations" isBlocking={false}>
      {page}
    </ProjectLayout>
  )
}

export default CronJobsPage
