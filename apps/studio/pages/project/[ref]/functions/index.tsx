import { useParams } from 'common'
import { Button, Dialog, DialogContent, DialogSection, DialogTrigger } from 'ui'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from 'ui'
import { ChevronDown, Terminal, Code } from 'lucide-react'

import {
  EdgeFunctionsListItem,
  FunctionsEmptyState,
  TerminalInstructions,
} from 'components/interfaces/Functions'
import EdgeFunctionPanel from 'components/interfaces/Functions/EdgeFunctionPanel'
import EdgeFunctionsLayout from 'components/layouts/EdgeFunctionsLayout/EdgeFunctionsLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageContainer, PageLayout } from 'components/layouts/PageLayout'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useEdgeFunctionsQuery } from 'data/edge-functions/edge-functions-query'
import type { NextPageWithLayout } from 'types'
import { DocsButton } from 'components/ui/DocsButton'
import { useState } from 'react'

const FunctionsPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const [showCreatePanel, setShowCreatePanel] = useState(false)
  const {
    data: functions,
    error,
    isLoading,
    isError,
    isSuccess,
  } = useEdgeFunctionsQuery({ projectRef: ref })

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
            <DropdownMenuItem className="gap-4">
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
        <DropdownMenuItem onSelect={() => setShowCreatePanel(true)} className="gap-4">
          <Code className="shrink-0" size={16} strokeWidth={1.5} />
          <div>
            <span className="text-foreground">Via Editor</span>
            <p>
              Create an edge function in the Supabase Studio editor and then deploy your function
            </p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const secondaryActions = [
    <DocsButton key="docs" href="https://supabase.com/docs/guides/functions" />,
  ]

  return (
    <PageLayout
      size="large"
      title="Edge Functions"
      subtitle="Deploy edge functions to handle complex business logic"
      primaryActions={deployButton}
      secondaryActions={secondaryActions}
    >
      <PageContainer size="large">
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

        <EdgeFunctionPanel visible={showCreatePanel} onClose={() => setShowCreatePanel(false)} />
      </PageContainer>
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
