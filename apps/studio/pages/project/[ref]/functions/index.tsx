import { useParams } from 'common'
import { AiIconAnimation, Button, Dialog, DialogContent, DialogSection, DialogTrigger } from 'ui'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from 'ui'
import { ChevronDown, Terminal, Code } from 'lucide-react'
import { useRouter } from 'next/router'
import {
  EdgeFunctionsListItem,
  FunctionsEmptyState,
  TerminalInstructions,
} from 'components/interfaces/Functions'
import EdgeFunctionsLayout from 'components/layouts/EdgeFunctionsLayout/EdgeFunctionsLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useEdgeFunctionsQuery } from 'data/edge-functions/edge-functions-query'
import type { NextPageWithLayout } from 'types'
import { DocsButton } from 'components/ui/DocsButton'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useAppStateSnapshot } from 'state/app-state'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import { useFlag } from 'hooks/ui/useFlag'

const FunctionsPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const { setAiAssistantPanel } = useAppStateSnapshot()
  const router = useRouter()
  const {
    data: functions,
    error,
    isLoading,
    isError,
    isSuccess,
  } = useEdgeFunctionsQuery({ projectRef: ref })
  const edgeFunctionCreate = useFlag('edgeFunctionCreate')

  const hasFunctions = (functions ?? []).length > 0

  const deployButton = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="primary" iconRight={<ChevronDown className="w-4 h-4" strokeWidth={1.5} />}>
          Deploy a new function
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <Dialog>
          <DialogTrigger asChild>
            <DropdownMenuItem className="gap-4" onSelect={(e) => e.preventDefault()}>
              <Terminal className="shrink-0" size={16} strokeWidth={1.5} />
              <div>
                <span className="text-foreground">Via CLI</span>
                <p>
                  Create an edge function locally and then deploy your function via the Supabase CLI
                </p>
              </div>
            </DropdownMenuItem>
          </DialogTrigger>
          <DialogContent size="large">
            <DialogSection padding="small">
              <TerminalInstructions />
            </DialogSection>
          </DialogContent>
        </Dialog>
        {edgeFunctionCreate && (
          <DropdownMenuItem
            onSelect={() => router.push(`/project/${ref}/functions/new`)}
            className="gap-4"
          >
            <Code className="shrink-0" size={16} strokeWidth={1.5} />
            <div>
              <span className="text-foreground">Via Editor</span>
              <p>
                Create an edge function in the Supabase Studio editor and then deploy your function
              </p>
            </div>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const secondaryActions = [
    <DocsButton key="docs" href="https://supabase.com/docs/guides/functions" />,
    <ButtonTooltip
      type="default"
      className="px-1 pointer-events-auto"
      icon={<AiIconAnimation size={16} />}
      onClick={() =>
        setAiAssistantPanel({
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
      }
      tooltip={{
        content: {
          side: 'bottom',
          text: 'Create with Supabase Assistant',
        },
      }}
    />,
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
        {isLoading && (
          <div className="pt-8">
            <GenericSkeletonLoader />
          </div>
        )}

        {isError && <AlertError error={error} subject="Failed to retrieve edge functions" />}

        {isSuccess && (
          <>
            {hasFunctions ? (
              <div className="py-6 space-y-4">
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
              </div>
            ) : (
              <FunctionsEmptyState />
            )}
          </>
        )}
      </ScaffoldContainer>
    </PageLayout>
  )
}

FunctionsPage.getLayout = (page) => {
  return (
    <DefaultLayout>
      <EdgeFunctionsLayout>{page}</EdgeFunctionsLayout>
    </DefaultLayout>
  )
}

export default FunctionsPage
