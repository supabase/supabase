import { CircleDotIcon, CopyIcon, LinkIcon, MoreVerticalIcon } from 'lucide-react'
import { toast } from 'sonner'
import {
  AiIconAnimation,
  copyToClipboard,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

import { buildIssuePrompt } from './Issues.utils'
import {
  ExplorerToolbar,
  ExplorerToolbarAction,
  ExplorerToolbarActions,
  ExplorerToolbarIcon,
  ExplorerToolbarTitle,
} from '@/components/interfaces/Explorer/ExplorerToolbar'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import type { Issue } from '@/data/issues/issue-schema'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'

export const IssueDetailToolbar = ({ issue }: { issue: Issue }) => {
  const snap = useAiAssistantStateSnapshot()
  const { openSidebar } = useSidebarManagerSnapshot()

  const handleAskAssistant = () => {
    openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
    snap.newChat({ name: issue.title, initialMessage: buildIssuePrompt(issue) })
  }

  const handleCopyPrompt = () => {
    copyToClipboard(buildIssuePrompt(issue))
    toast.success('Issue copied for your agent')
  }

  const handleCopyLink = () => {
    copyToClipboard(window.location.href)
    toast.success('Link copied')
  }

  const handleCopyId = () => {
    copyToClipboard(issue.id)
    toast.success('Issue ID copied')
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
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <ExplorerToolbarAction
              aria-label="More issue actions"
              icon={<MoreVerticalIcon size={16} />}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem className="gap-x-2" onSelect={handleCopyLink}>
              <LinkIcon size={14} />
              Copy link
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-x-2" onSelect={handleCopyId}>
              <CopyIcon size={14} />
              Copy issue ID
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ExplorerToolbarActions>
    </ExplorerToolbar>
  )
}
