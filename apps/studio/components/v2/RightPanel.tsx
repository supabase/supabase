'use client'

import { X } from 'lucide-react'
import { Button } from 'ui'

import { useV2DashboardStore } from '@/stores/v2-dashboard'

import { AssistantPanel } from './AssistantPanel'
import { SqlPanel } from './SqlPanel'
import { AdvisorsPanel } from './AdvisorsPanel'

export function RightPanel() {
  const rightPanel = useV2DashboardStore((s) => s.rightPanel)
  const closeRightPanel = useV2DashboardStore((s) => s.closeRightPanel)

  if (!rightPanel) return null

  const titles = { chat: 'Assistant', sql: 'SQL', adv: 'Advisors' }
  const title = titles[rightPanel]

  return (
    <div className="w-[270px] flex flex-col shrink-0 border-l border-border bg-background">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <Button
          type="text"
          size="tiny"
          className="h-7 w-7"
          onClick={closeRightPanel}
          icon={<X className="h-4 w-4" />}
        >
          <span className="sr-only">Close panel</span>
        </Button>
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        {rightPanel === 'chat' && <AssistantPanel />}
        {rightPanel === 'sql' && <SqlPanel />}
        {rightPanel === 'adv' && <AdvisorsPanel />}
      </div>
    </div>
  )
}
