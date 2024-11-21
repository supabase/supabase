import { parseAsString, useQueryState } from 'nuqs'
import { ReactNode, useMemo, useState } from 'react'

import { INTEGRATIONS } from 'components/interfaces/Integrations/Landing/Integrations.constants'
import { QueuesOverviewTab } from 'components/interfaces/Integrations/NewQueues/OverviewTab'
import { QueuesTab } from 'components/interfaces/Integrations/NewQueues/QueuesTab'
import { QueueTab } from 'components/interfaces/Integrations/NewQueues/QueueTab'
import IntegrationsLayout from 'components/layouts/Integrations/layout'
import type { NextPageWithLayout } from 'types'

const QueuesPage: NextPageWithLayout = () => {
  const id = 'queues'
  const integration = INTEGRATIONS.find((i) => i.id === id)

  const [selectedTab] = useQueryState('tab', parseAsString.withDefault('overview'))
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
        content: <QueuesOverviewTab />,
      },
      {
        id: 'queues',
        label: 'Queues',
        content: (
          <div className="p-10">
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

  return (
    <IntegrationsLayout id={id} tabs={tabs}>
      {tabs.find((t) => t.id === selectedTab)?.content}
    </IntegrationsLayout>
  )
}

export default QueuesPage
