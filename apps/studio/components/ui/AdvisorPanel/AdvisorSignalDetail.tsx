import { useParams } from 'common'
import { EyeOff, Globe } from 'lucide-react'
import Link from 'next/link'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import type { AdvisorSignalItem } from './AdvisorPanel.types'
import { useAdvisorSignals } from './useAdvisorSignals'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { AiAssistantDropdown } from '@/components/ui/AiAssistantDropdown'
import { InlineLink } from '@/components/ui/InlineLink'
import { useAdvisorStateSnapshot } from '@/state/advisor-state'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'

interface AdvisorSignalDetailProps {
  item: AdvisorSignalItem
}

const buildSignalAssistantPrompt = (item: AdvisorSignalItem) => {
  return [
    `I'm reviewing an Advisor signal for a banned IP address: ${item.sourceData.ip}.`,
    item.description ?? item.summary,
    'Help me assess whether this ban should remain in place, what I should investigate before removing it, and what the safest next step is.',
    'Please include when it is reasonable to dismiss this signal versus remove the ban.',
  ].join('\n\n')
}

export const AdvisorSignalDetail = ({ item }: AdvisorSignalDetailProps) => {
  const { ref: projectRef } = useParams()

  const snap = useAiAssistantStateSnapshot()
  const { openSidebar } = useSidebarManagerSnapshot()
  const { setSelectedItem } = useAdvisorStateSnapshot()
  const { dismissSignal } = useAdvisorSignals({ projectRef })

  const issueDescription = (
    <>
      The IP address <code className="text-code-inline">{item.sourceData.ip}</code> is temporarily
      blocked because of suspicious traffic or repeated failed password attempts. If this block is
      expected, you can dismiss this signal or remove the ban.
    </>
  )

  const handleAskAssistant = () => {
    openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
    snap.newChat({
      name: `Review ${item.title.toLowerCase()}`,
      initialInput: buildSignalAssistantPrompt(item),
    })
  }

  const onDismissSignal = () => {
    dismissSignal(item.dismissalKey)
    setSelectedItem(undefined)
  }

  return (
    <div>
      <h3 className="text-sm mb-2">Entity</h3>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 px-2 py-0.5 bg-surface-200 border rounded-lg text-sm mb-6 w-fit">
            <span className="flex items-center text-foreground-muted" aria-hidden="true">
              <Globe size={15} className="text-foreground-muted" />
            </span>
            <span>{item.sourceData.ip}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">IP address currently blocked by network bans</TooltipContent>
      </Tooltip>

      <h3 className="text-sm mb-2">Issue</h3>
      <p className="text-sm text-foreground-light mb-6">
        {issueDescription}{' '}
        {item.docsUrl !== undefined && (
          <>
            <InlineLink href={item.docsUrl}>Learn more</InlineLink>.
          </>
        )}
      </p>

      <h3 className="text-sm mb-2">Resolve</h3>
      <div className="flex items-center gap-2">
        <AiAssistantDropdown
          label="Ask Assistant"
          buildPrompt={() => buildSignalAssistantPrompt(item)}
          onOpenAssistant={handleAskAssistant}
          telemetrySource="advisor_signal_detail"
        />
        {item.actions.map((action) => (
          <Button key={`${item.dismissalKey}-${action.href}`} type="default" asChild>
            <Link href={action.href}>
              <span className="flex items-center gap-2">{action.label}</span>
            </Link>
          </Button>
        ))}
        <Button
          type="default"
          icon={<EyeOff size={14} strokeWidth={1.5} />}
          onClick={onDismissSignal}
        >
          Dismiss
        </Button>
      </div>
    </div>
  )
}
