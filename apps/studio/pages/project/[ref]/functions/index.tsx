import { useParams } from 'common'
import { AiIconAnimation, Button, Dialog, DialogContent, DialogSection, DialogTrigger } from 'ui'

import {
  EdgeFunctionsListItem,
  FunctionsEmptyState,
  TerminalInstructions,
} from 'components/interfaces/Functions'
import DefaultLayout from 'components/layouts/DefaultLayout'
import EdgeFunctionsLayout from 'components/layouts/EdgeFunctionsLayout/EdgeFunctionsLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { DocsButton } from 'components/ui/DocsButton'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useEdgeFunctionsQuery } from 'data/edge-functions/edge-functions-query'
import { useAppStateSnapshot } from 'state/app-state'
import { ExternalLink } from 'lucide-react'
import type { NextPageWithLayout } from 'types'

const FunctionsPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const { setAiAssistantPanel } = useAppStateSnapshot()

  const {
    data: functions,
    error,
    isLoading,
    isError,
    isSuccess,
  } = useEdgeFunctionsQuery({ projectRef: ref })

  const hasFunctions = (functions ?? []).length > 0

  const deployButton = (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="primary">Deploy a new function</Button>
      </DialogTrigger>
      <DialogContent size="large">
        <DialogSection padding="small">
          <TerminalInstructions />
        </DialogSection>
      </DialogContent>
    </Dialog>
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

  if (!hasFunctions) {
    secondaryActions.unshift(
      <Button asChild type="default" icon={<ExternalLink />}>
        <a
          target="_blank"
          rel="noreferrer"
          href="https://github.com/supabase/supabase/tree/master/examples/edge-functions/supabase/functions"
        >
          Examples
        </a>
      </Button>
    )
  }

  return (
    <PageLayout
      size="large"
      title="Edge Functions"
      subtitle="Server-side TypeScript functions distributed globally at the edge"
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
