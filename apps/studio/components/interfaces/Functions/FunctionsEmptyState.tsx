import { useParams } from 'common'
import { ScaffoldSectionTitle } from 'components/layouts/Scaffold'
import { ResourceItem } from 'components/ui/Resource/ResourceItem'
import { ResourceList } from 'components/ui/Resource/ResourceList'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useFlag } from 'hooks/ui/useFlag'
import { Code, Terminal } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import {
  AiIconAnimation,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogSection,
  DialogTrigger,
} from 'ui'
import { EDGE_FUNCTION_TEMPLATES } from './Functions.templates'
import { TerminalInstructions } from './TerminalInstructions'
import { ActionCard } from 'components/ui/ActionCard'
import React from 'react'

// [New Component] FunctionCreationMethodCard
interface FunctionCreationMethodCardProps {
  icon: React.ReactNode
  title: string
  description: string
  action: React.ReactNode
}

const FunctionCreationMethodCard: React.FC<FunctionCreationMethodCardProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="p-8 flex flex-col gap-3">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          {icon}
          <h4 className="text-base text-foreground">{title}</h4>
        </div>
        <p className="text-sm text-foreground-light mb-4 mt-1 max-w-xs">{description}</p>
      </div>
      <div>{action}</div>
    </div>
  )
}

export const FunctionsEmptyState = () => {
  const { ref } = useParams()
  const router = useRouter()
  const aiSnap = useAiAssistantStateSnapshot()
  const edgeFunctionCreate = useFlag('edgeFunctionCreate')

  const { mutate: sendEvent } = useSendEventMutation()
  const org = useSelectedOrganization()

  return (
    <>
      <Card className="bg-surface-75">
        <CardHeader>
          <CardTitle>Create your first edge function</CardTitle>
        </CardHeader>
        <CardContent className="p-0 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] divide-y md:divide-y-0 md:divide-x divide-default items-stretch">
          {/* Editor Option */}
          {edgeFunctionCreate && (
            <FunctionCreationMethodCard
              icon={<Code strokeWidth={1.5} size={20} />}
              title="Via Editor"
              description="Create and edit functions directly in the browser. Download to local at any time."
              action={
                <Button
                  type="default"
                  onClick={() => {
                    router.push(`/project/${ref}/functions/new`)
                    sendEvent({
                      action: 'edge_function_via_editor_button_clicked',
                      properties: { origin: 'no_functions_block' },
                      groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
                    })
                  }}
                >
                  Open Editor
                </Button>
              }
            />
          )}

          {/* AI Assistant Option */}
          <FunctionCreationMethodCard
            icon={<AiIconAnimation size={20} />}
            title="AI Assistant"
            description="Let our AI assistant help you create functions. Perfect for kickstarting a function."
            action={
              <Button
                type="default"
                onClick={() => {
                  aiSnap.newChat({
                    name: 'Create new edge function',
                    open: true,
                    initialInput: 'Create a new edge function that ...',
                    suggestions: {
                      title:
                        'I can help you create a new edge function. Here are a few example prompts to get you started:',
                      prompts: [
                        'Create a new edge function that processes payments with Stripe',
                        'Create a new edge function that sends emails with Resend',
                        'Create a new edge function that generates PDFs from HTML templates',
                      ],
                    },
                  })
                  sendEvent({
                    action: 'edge_function_ai_assistant_button_clicked',
                    properties: { origin: 'no_functions_block' },
                    groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
                  })
                }}
              >
                Open Assistant
              </Button>
            }
          />

          {/* CLI Option */}
          <FunctionCreationMethodCard
            icon={<Terminal strokeWidth={1.5} size={20} />}
            title="Via CLI"
            description="Create and deploy functions using the Supabase CLI. Ideal for local development and version control."
            action={
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    type="default"
                    onClick={() =>
                      sendEvent({
                        action: 'edge_function_via_cli_button_clicked',
                        properties: { origin: 'no_functions_block' },
                        groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
                      })
                    }
                  >
                    View CLI Instructions
                  </Button>
                </DialogTrigger>
                <DialogContent size="large">
                  <DialogSection padding="small">
                    <TerminalInstructions />
                  </DialogSection>
                </DialogContent>
              </Dialog>
            }
          />
        </CardContent>
      </Card>
      {edgeFunctionCreate && (
        <>
          <ScaffoldSectionTitle className="text-xl mb-4 mt-12">
            Start with a template
          </ScaffoldSectionTitle>

          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 ">
            {EDGE_FUNCTION_TEMPLATES.map((template) => (
              <ActionCard
                key={template.name}
                // media={<Code strokeWidth={1.5} size={16} className="-translate-y-[9px]" />}
                onClick={() => {
                  sendEvent({
                    action: 'edge_function_template_clicked',
                    properties: { templateName: template.name, origin: 'functions_page' },
                    groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
                  })
                }}
                title={template.name}
                description={template.description}
                icon={<Code strokeWidth={1.5} size={16} className="-translate-y-[9px]" />}
              />
            ))}
          </div>
        </>
      )}
    </>
  )
}
