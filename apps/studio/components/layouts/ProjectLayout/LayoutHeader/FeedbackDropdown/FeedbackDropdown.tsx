import { IS_PLATFORM } from 'common'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Lightbulb, TriangleAlert } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import {
  Button,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverSeparator_Shadcn_,
  PopoverTrigger_Shadcn_,
} from 'ui'

import { ASSISTANT_SUGGESTIONS } from '../HelpPanel/HelpPanel.constants'
import { getSupportLinkQueryParams } from '../HelpPanel/HelpPanel.utils'
import { HelpSection } from '../HelpPanel/HelpSection'
import { FeedbackWidget } from './FeedbackWidget'

export const FeedbackDropdown = ({ className }: { className?: string }) => {
  const router = useRouter()
  const { data: project } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()
  const snap = useAiAssistantStateSnapshot()
  const { openSidebar } = useSidebarManagerSnapshot()
  const [isOpen, setIsOpen] = useState(false)
  const [stage, setStage] = useState<'select' | 'issue-options' | 'widget'>('select')

  const projectRef = project?.parent_project_ref ?? (router.query.ref as string | undefined)
  const supportLinkQueryParams = getSupportLinkQueryParams(
    project,
    org,
    router.query.ref as string | undefined
  )

  return (
    <Popover_Shadcn_
      modal={false}
      open={isOpen}
      onOpenChange={(e) => {
        setIsOpen(e)
        if (!e) setStage('select')
      }}
    >
      <PopoverTrigger_Shadcn_ asChild>
        <Button
          asChild
          onClick={() => {
            setIsOpen((isOpen) => !isOpen)
            setStage('select')
          }}
          type="text"
          className="rounded-full h-[32px] text-foreground-light hover:text-foreground"
        >
          <span className={className}>Feedback</span>
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_
        side="bottom"
        align="end"
        className="p-0 flex flex-col w-96"
        id="feedback-widget"
      >
        {stage === 'select' && (
          <div className="flex flex-col gap-4 p-4">
            <div className="font-medium text-sm">What would you like to share?</div>
            <div className="grid grid-cols-2 gap-3">
              <Button type="default" className="h-32" onClick={() => setStage('issue-options')}>
                <div className="grid gap-1.5 text-center">
                  <TriangleAlert size="28" className="mx-auto text-destructive-600" />
                  <div className="flex flex-col items-center">
                    <span className="text-base">Issue</span>
                    <span className="text-xs text-foreground-lighter">with my project</span>
                  </div>
                </div>
              </Button>
              <Button type="default" className="h-32" onClick={() => setStage('widget')}>
                <div className="grid gap-1.5 text-center">
                  <Lightbulb size="28" className="mx-auto text-warning" />
                  <div className="flex flex-col items-center">
                    <span className="text-base">Idea</span>
                    <span className="text-xs text-foreground-lighter">to improve Supabase</span>
                  </div>
                </div>
              </Button>
            </div>
          </div>
        )}
        {stage === 'issue-options' && (
          <>
            <div className="flex flex-col gap-4 p-4">
              <HelpSection
                excludeIds={[]}
                isPlatform={IS_PLATFORM}
                projectRef={projectRef}
                supportLinkQueryParams={supportLinkQueryParams}
                onAssistantClick={() => {
                  openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
                  snap.newChat(ASSISTANT_SUGGESTIONS)
                  setIsOpen(false)
                }}
                onSupportClick={() => setIsOpen(false)}
              />
            </div>
            <PopoverSeparator_Shadcn_ />
            <div className="px-4 pt-4 pb-4">
              <Button type="default" size="tiny" onClick={() => setStage('widget')}>
                Leave feedback instead
              </Button>
            </div>
          </>
        )}
        {stage === 'widget' && (
          <FeedbackWidget
            onClose={() => setIsOpen(false)}
            onSwitchToIssueOptions={() => setStage('issue-options')}
          />
        )}
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
