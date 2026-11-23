import { Issues } from 'icons'
import { AiIconAnimation, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { buildIssuePrompt, getIssueTelemetryProperties } from './Issues.utils'
import {
  ExplorerToolbar,
  ExplorerToolbarAction,
  ExplorerToolbarActions,
  ExplorerToolbarIcon,
  ExplorerToolbarTitle,
} from '@/components/interfaces/Explorer/ExplorerToolbar'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import CopyButton from '@/components/ui/CopyButton'
import type { Issue } from '@/data/issues/issue.types'
import { useTrack } from '@/lib/telemetry/track'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'

export const IssueDetailToolbar = ({ issue }: { issue: Issue }) => {
  const track = useTrack()
  const snap = useAiAssistantStateSnapshot()
  const { openSidebar } = useSidebarManagerSnapshot()

  const handleAskAssistant = () => {
    track('advisor_assistant_button_clicked', {
      origin: 'lint_detail',
      ...getIssueTelemetryProperties(issue),
    })
    openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
    snap.newChat({ name: issue.title, initialMessage: buildIssuePrompt(issue) })
  }

  return (
    <ExplorerToolbar aria-label="Issue toolbar" className="md:h-(--header-height)">
      <ExplorerToolbarIcon>
        <Issues size={16} strokeWidth={2} />
      </ExplorerToolbarIcon>
      <ExplorerToolbarTitle className="text-foreground-light">{issue.title}</ExplorerToolbarTitle>
      <ExplorerToolbarActions>
        <ExplorerToolbarAction
          aria-label="Ask Assistant"
          tooltip="Ask Assistant"
          className="group"
          icon={
            <AiIconAnimation
              size={16}
              className="text-tertiary-foreground group-hover:text-primary"
            />
          }
          onClick={handleAskAssistant}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <CopyButton
              variant="default"
              size="tiny"
              className="ml-1"
              asyncText={() => buildIssuePrompt(issue)}
              onClick={() => track('ai_prompt_copied', { source: 'lint_detail' })}
            />
          </TooltipTrigger>
          <TooltipContent side="bottom">Copy issue for your agent</TooltipContent>
        </Tooltip>
      </ExplorerToolbarActions>
    </ExplorerToolbar>
  )
}
