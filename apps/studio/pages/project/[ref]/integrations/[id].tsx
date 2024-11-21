import { parseAsString, useQueryState } from 'nuqs'

import { useParams } from 'common'
import { INTEGRATIONS } from 'components/interfaces/Integrations/Landing/Integrations.constants'
import { WrapperOverviewTab } from 'components/interfaces/Integrations/Wrappers/OverviewTab'
import { WrappersTab } from 'components/interfaces/Integrations/Wrappers/WrappersTab'
import IntegrationsLayout from 'components/layouts/Integrations/layout'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import type { NextPageWithLayout } from 'types'
import { Button } from 'ui'

const Logs = () => {
  const { id } = useParams()
  return (
    <div className="">
      <div className="px-10 bg-surface-100 flex items-center gap-2 py-2 border-b">
        <div className="flex items-center gap-2">
          <Button className="px-2 py-1 text-xs bg-surface-100 hover:bg-surface-200 rounded-md transition">
            Clear logs
          </Button>
          <Button className="px-2 py-1 text-xs bg-surface-100 hover:bg-surface-200 rounded-md transition">
            Download
          </Button>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <select className="px-2 py-1 text-xs bg-surface-100 rounded-md">
            <option>Last 24 hours</option>
            <option>Last 7 days</option>
            <option>Last 30 days</option>
          </select>
          <input
            type="search"
            placeholder="Search logs..."
            className="px-2 py-1 text-xs bg-surface-100 rounded-md w-[200px]"
          />
        </div>
      </div>
      <div className="">
        {/* [TODO] Populate with actual logs */}
        {[...Array(100)].map((_, i) => (
          <div key={i} className="px-10 py-0.5 font-mono text-sm hover:bg-surface-100/50">
            <div className="flex items-center gap-2 text-foreground-light">
              <span className="text-foreground-lighter">[{new Date().toISOString()}]</span>
              <span className="px-1.5 py-0.5 bg-success-900/30 text-success-500 rounded-full text-xs">
                SUCCESS
              </span>
              <span className="text-foreground">Integration {id} execution completed</span>
            </div>
            {/* <div className="mt-2 pl-6 text-foreground-light">
      Integration executed successfully
    </div>
    <div className="mt-2 pl-6 flex items-center gap-2 text-xs text-foreground-lighter">
      <span>duration=0.24s</span>
      <span>status=success</span>
      <span>request_id=req_8f3d92</span>
    </div> */}
          </div>
        ))}
      </div>
    </div>
  )
}

const tabs = [
  {
    id: 'overview',
    label: 'Overview',
    content: <WrapperOverviewTab />,
  },
  {
    id: 'wrappers',
    label: 'Wrappers',
    content: <WrappersTab />,
  },
  // [Joshen] Hiding for now, will implement after LW13
  // {
  //   id: 'logs',
  //   label: 'Logs',
  //   content: <Logs />,
  // },
]

const WrapperPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { id } = useParams()
  const [selectedTab] = useQueryState('tab', parseAsString.withDefault('overview'))

  const integration = INTEGRATIONS.find((i) => i.id === id)

  useEffect(() => {
    if (id && (!integration || integration.type !== 'wrapper')) {
      router.push('/404')
      return
    }
  }, [integration, router])

  // Add early return while checking integration
  if (!integration || integration.type !== 'wrapper') {
    return null
  }

  // the key={id} is added to have animations when switching from a wrapper to a wrapper.
  return (
    <IntegrationsLayout id={id!} tabs={tabs} key={id}>
      {tabs.find((t) => t.id === selectedTab)?.content}
    </IntegrationsLayout>
  )
}

export default WrapperPage
