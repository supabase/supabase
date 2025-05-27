import { ChevronDown, Code, ExternalLink, Terminal } from 'lucide-react'
import { useRouter } from 'next/router'

import { useParams } from 'common'
import { EdgeFunctionsListItem } from 'components/interfaces/Functions/EdgeFunctionsListItem'
import { FunctionsEmptyState } from 'components/interfaces/Functions/FunctionsEmptyState'
import { TerminalInstructions } from 'components/interfaces/Functions/TerminalInstructions'
import DefaultLayout from 'components/layouts/DefaultLayout'
import EdgeFunctionsLayout from 'components/layouts/EdgeFunctionsLayout/EdgeFunctionsLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { DocsButton } from 'components/ui/DocsButton'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useEdgeFunctionsQuery } from 'data/edge-functions/edge-functions-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import type { NextPageWithLayout } from 'types'
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

const EdgeFunctionsPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const snap = useAiAssistantStateSnapshot()
  const router = useRouter()
  const {
    data: functions,
    error,
    isLoading,
    isError,
    isSuccess,
  } = useEdgeFunctionsQuery({ projectRef: ref })
  const { mutate: sendEvent } = useSendEventMutation()
  const org = useSelectedOrganization()

  const hasFunctions = (functions ?? []).length > 0

  const deployButton = (
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
                  'Create a new edge function that processes payments with Stripe',
                  'Create a new edge function that sends emails with Resend',
                  'Create a new edge function that generates PDFs from HTML templates',
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

  const secondaryActions = [
    <DocsButton key="docs" href="https://supabase.com/docs/guides/functions" />,
    <Button asChild key="edge-function-examples" type="default" icon={<ExternalLink />}>
      <a
        target="_blank"
        rel="noreferrer"
        href="https://github.com/supabase/supabase/tree/master/examples/edge-functions/supabase/functions"
      >
        Examples
      </a>
    </Button>,
  ]

  return (
    <PageLayout
      size="large"
      title="Edge Functions"
      subtitle="Deploy edge functions to handle complex business logic"
      primaryActions={deployButton}
      secondaryActions={secondaryActions}
    >
      <ScaffoldContainer size="large">
        <ScaffoldSection isFullWidth>
          {isLoading && <GenericSkeletonLoader />}

          {isError && <AlertError error={error} subject="Failed to retrieve edge functions" />}

          {isSuccess && (
            <>
              {hasFunctions ? (
                <Table
                  head={
                    <>
                      <Table.th>Name</Table.th>
                      <Table.th>URL</Table.th>
                      <Table.th className="hidden 2xl:table-cell">Created</Table.th>
                      <Table.th className="lg:table-cell">Last updated</Table.th>
                      <Table.th className="lg:table-cell">Deployments</Table.th>
                    </>
                  }
                  body={
                    <>
                      {functions.length > 0 &&
                        functions.map((item) => (
                          <EdgeFunctionsListItem key={item.id} function={item} />
                        ))}
                    </>
                  }
                />
              ) : (
                <FunctionsEmptyState />
              )}
            </>
          )}
        </ScaffoldSection>
      </ScaffoldContainer>
    </PageLayout>
  )
}

EdgeFunctionsPage.getLayout = (page) => {
  return (
    <DefaultLayout>
      <EdgeFunctionsLayout>{page}</EdgeFunctionsLayout>
    </DefaultLayout>
  )
}

export default EdgeFunctionsPage
