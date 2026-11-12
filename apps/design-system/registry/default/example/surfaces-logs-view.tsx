'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { LogsView, type LogsViewProps } from 'surfaces/logs'

import { sampleLogs, sampleProject } from './surfaces-sample-data'

export default function SurfacesLogsView() {
  const [settings, setSettings] = useState<LogsViewProps['settings']>({
    minutes: 60,
    search: '',
    source: 'all',
    level: 'all',
  })

  return (
    <div className="flex h-[520px] w-full min-h-0 flex-col overflow-hidden rounded-md border">
      <LogsView
        project={sampleProject}
        enabled
        settings={settings}
        onSettingsChange={setSettings}
        logs={{ status: 'success', data: sampleLogs }}
        onRefresh={() => toast('Refresh logs')}
        onAsk={async (request) => {
          // The host turns the request into a message for its agent.
          toast(`Agent request: ${request.type}`)
        }}
        agentName="Assistant"
      />
    </div>
  )
}
