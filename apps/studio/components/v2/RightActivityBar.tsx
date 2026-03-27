'use client'

import { AdvisorButton } from 'components/layouts/AppLayout/AdvisorButton'
import { AssistantButton } from 'components/layouts/AppLayout/AssistantButton'
import { InlineEditorButton } from 'components/layouts/AppLayout/InlineEditorButton'
import { HelpButton } from 'components/ui/HelpPanel/HelpButton'

import { useV2Params } from '@/app/v2/V2ParamsContext'

export function RightActivityBar() {
  const { projectRef } = useV2Params()

  return (
    <aside className="w-11 flex flex-col shrink-0 border-l border-border bg-dash-sidebar py-2 h-full">
      <div className="flex flex-col items-center gap-2">
        <AssistantButton side="left" />
        <InlineEditorButton side="left" />
        <AdvisorButton projectRef={projectRef} side="left" />
      </div>
      <div className="flex-1" />
      <div className="flex flex-col items-center">
        <HelpButton side="left" />
      </div>
    </aside>
  )
}
