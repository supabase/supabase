import { ChevronDown, Code, Terminal } from 'lucide-react'
import { useRouter } from 'next/router'

import { useParams } from 'common'
import { TerminalInstructions } from 'components/interfaces/Functions/TerminalInstructions'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import {
  AiIconAnimation,
  Button,
  Dialog,
  DialogContent,
  DialogSection,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

export const DeployEdgeFunctionButton = () => {
  const router = useRouter()
  const { ref } = useParams()
  const { data: org } = useSelectedOrganizationQuery()
  const snap = useAiAssistantStateSnapshot()

  const { mutate: sendEvent } = useSendEventMutation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="primary" iconRight={<ChevronDown className="w-4 h-4" strokeWidth={1.5} />}>
          Deploy a new function
        </Button>
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
        <Dialog>
          <DialogTrigger asChild>
            <DropdownMenuItem
              className="gap-4"
              onSelect={(e) => {
                e.preventDefault()
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
          </DialogTrigger>
          <DialogContent size="large">
            <DialogTitle className="sr-only">
              Create your first Edge Function via the CLI
            </DialogTitle>
            <DialogSection padding="small">
              <TerminalInstructions />
            </DialogSection>
          </DialogContent>
        </Dialog>
        <DropdownMenuItem
          className="gap-4"
          onSelect={() => {
            snap.newChat({
              name: 'Create new edge function',
              open: true,
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
