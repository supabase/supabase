import { INTEGRATIONS } from 'components/interfaces/Integrations/Landing/Integrations.constants'
import { IntegrationWrapper } from 'components/interfaces/Integrations/Landing/IntegrationWrapper'
import { QueuesOverviewTab } from 'components/interfaces/Integrations/NewQueues/OverviewTab'
import { QueuesTab } from 'components/interfaces/Integrations/NewQueues/QueuesTab'
import { QueueTab } from 'components/interfaces/Integrations/NewQueues/QueueTab'
import ProjectLayout from 'components/layouts/ProjectLayout/ProjectLayout'
import { useQueryState } from 'nuqs'
import { ReactNode, useMemo, useState } from 'react'
import type { NextPageWithLayout } from 'types'

const QueuesPage: NextPageWithLayout = () => {
  const id = 'supabase-queues'

  const integration = INTEGRATIONS.find((i) => i.id === id)
  const [selectedTab] = useQueryState('tab')
  const [selectedQueues, setSelectedQueues] = useState<string[]>([])

  if (selectedTab?.startsWith('queue_')) {
    const selectedQueueName = selectedTab.replace('queue_', '')
    if (selectedQueueName && !selectedQueues.includes(selectedQueueName)) {
      setSelectedQueues([...selectedQueues, selectedQueueName])
    }
  }

  const tabs = useMemo(() => {
    const tabs: { id: string; label: string; content: ReactNode }[] = [
      {
        id: 'overview',
        label: 'Overview',
        content: (
          <div className="p-9">
            <QueuesOverviewTab />
          </div>
        ),
      },
      {
        id: 'queues',
        label: 'Queues',
        content: (
          <div className="p-9">
            <QueuesTab />
          </div>
        ),
      },
    ]

    selectedQueues.forEach((q) => {
      tabs.push({
        id: `queue_${q}`,
        label: `Queue ${q}`,
        content: <QueueTab queueName={q} />,
      })
    })

    return tabs
  }, [selectedQueues])

  if (!integration) {
    return null
  }

  return <IntegrationWrapper integration={integration} tabs={tabs} />
}

QueuesPage.getLayout = (page) => {
  return (
    <ProjectLayout title={'Integrations'} product="Integrations" isBlocking={false}>
      {page}
    </ProjectLayout>
  )
}

export default QueuesPage
