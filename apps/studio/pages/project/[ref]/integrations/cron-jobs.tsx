import { useMemo } from 'react'

import { INTEGRATIONS } from 'components/interfaces/Integrations/Landing/Integrations.constants'
import { CronjobsTab } from 'components/interfaces/Integrations/NewCronJobs/CronjobsTab'
import { CronjobsOverviewTab } from 'components/interfaces/Integrations/NewCronJobs/OverviewTab'
import IntegrationsLayout from 'components/layouts/Integrations/layout'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { parseAsString, useQueryState } from 'nuqs'
import type { NextPageWithLayout } from 'types'

const CronJobsPage: NextPageWithLayout = () => {
  const id = 'cron-jobs'
  const integration = INTEGRATIONS.find((i) => i.id === id)

  const project = useSelectedProject()

  const { data: extensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const [selectedTab] = useQueryState('tab', parseAsString.withDefault('overview'))

  const pgCronExtension = (extensions ?? []).find((ext) => ext.name === 'pg_cron')
  const pgCronExtensionInstalled = !!pgCronExtension?.installed_version

  const tabs = useMemo(() => {
    return [
      {
        id: 'overview',
        label: 'Overview',
        content: <CronjobsOverviewTab />,
      },
      ...(pgCronExtensionInstalled
        ? [
            {
              id: 'cronjobs',
              label: 'Cron jobs',
              content: (
                <div className="p-10">
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

  return (
    <IntegrationsLayout id={id} tabs={tabs}>
      {tabs.find((t) => t.id === selectedTab)?.content}
    </IntegrationsLayout>
  )
}

export default CronJobsPage
