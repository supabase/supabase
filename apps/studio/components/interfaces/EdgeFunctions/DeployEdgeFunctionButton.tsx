import { useParams } from 'common'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { ChevronDown, Code, Terminal } from 'lucide-react'
import { useRouter } from 'next/router'
import { parseAsString, useQueryState } from 'nuqs'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import {
  AiIconAnimation,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useIsProjectActive } from '@/hooks/misc/useSelectedProject'

export const DeployEdgeFunctionButton = () => {
  const router = useRouter()
  const { ref } = useParams()
  const { data: org } = useSelectedOrganizationQuery()

  const snap = useAiAssistantStateSnapshot()
  const { openSidebar } = useSidebarManagerSnapshot()

  const { mutate: sendEvent } = useSendEventMutation()
  const [, setCreateMethod] = useQueryState('create', parseAsString)

  const isProjectActive = useIsProjectActive()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={!isProjectActive}>
        <ButtonTooltip
          type="primary"
          disabled={!isProjectActive}
          iconRight={<ChevronDown className="w-4 h-4" strokeWidth={1.5} />}
          tooltip={{
            content: {
              side: 'bottom',
              text: !isProjectActive
                ? 'Unable to deploy function as project is inactive'
                : undefined,
            },
          }}
        >
          Deploy a new function
        </ButtonTooltip>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuItem
          onSelect={() => {
            router.push(`/project/${ref}/functions/new`)
            sendEvent({
              action: 'edge_function_via_editor_button_clicked',
              properties: { origin: 'secondary_action' },
              groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
            })
          }}
          className="gap-4"
        >
          <Code className="shrink-0" size={16} strokeWidth={1.5} />
          <div>
            <span className="text-foreground">Via Editor</span>
            <p>Write and deploy in the browser</p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-4"
          onSelect={() => {
            setCreateMethod('cli')
            sendEvent({
              action: 'edge_function_via_cli_button_clicked',
              properties: { origin: 'secondary_action' },
              groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
            })
          }}
        >
          <Terminal className="shrink-0" size={16} strokeWidth={1.5} />
          <div>
            <span className="text-foreground">Via CLI</span>
            <p>Write locally, deploy with the CLI</p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-4"
          onSelect={() => {
            openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
            snap.newChat({
              name: 'Create new edge function',
              initialInput: `Create a new edge function that ...`,
              suggestions: {
                title:
                  'I can help you create a new edge function. Here are a few example prompts to get you started:',
                prompts: [
                  {
                    label: 'Stripe Payments',
                    description: 'Create a new edge function that processes payments with Stripe',
                  },
                  {
                    label: 'Email with Resend',
                    description: 'Create a new edge function that sends emails with Resend',
                  },
                  {
                    label: 'PDF Generator',
                    description:
                      'Create a new edge function that generates PDFs from HTML templates',
                  },
                ],
              },
            })
            sendEvent({
              action: 'edge_function_ai_assistant_button_clicked',
              properties: { origin: 'secondary_action' },
              groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
            })
          }}
        >
          <AiIconAnimation className="shrink-0" size={16} />
          <div>
            <span className="text-foreground">Via AI Assistant</span>
            <p>Let the Assistant write and deploy for you</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
