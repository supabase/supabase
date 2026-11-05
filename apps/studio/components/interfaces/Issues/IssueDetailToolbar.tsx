import { CircleDotIcon, CopyIcon } from 'lucide-react'
import { toast } from 'sonner'
import { AiIconAnimation, copyToClipboard } from 'ui'

import { buildIssuePrompt, getIssueTelemetryProperties } from './Issues.utils'
import {
  ExplorerToolbar,
  ExplorerToolbarAction,
  ExplorerToolbarActions,
  ExplorerToolbarIcon,
  ExplorerToolbarTitle,
} from '@/components/interfaces/Explorer/ExplorerToolbar'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
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

  const handleCopyPrompt = () => {
    track('ai_prompt_copied', { source: 'lint_detail' })
    copyToClipboard(buildIssuePrompt(issue))
    toast.success('Issue copied for your agent')
  }

  return (
    <ExplorerToolbar aria-label="Issue toolbar" className="md:h-(--header-height)">
      <ExplorerToolbarIcon>
        <CircleDotIcon size={16} strokeWidth={2} />
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
        <ExplorerToolbarAction
          aria-label="Copy issue for your agent"
          tooltip="Copy issue for your agent"
          icon={<CopyIcon size={16} />}
          onClick={handleCopyPrompt}
        />
      </ExplorerToolbarActions>
    </ExplorerToolbar>
  )
}
