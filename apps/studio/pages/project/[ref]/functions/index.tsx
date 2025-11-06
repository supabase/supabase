import React from 'react'
import { ExternalLink } from 'lucide-react'

import { useParams } from 'common'
import { DeployEdgeFunctionButton } from 'components/interfaces/EdgeFunctions/DeployEdgeFunctionButton'
import { EdgeFunctionsListItem } from 'components/interfaces/Functions/EdgeFunctionsListItem'
import {
  FunctionsEmptyState,
  FunctionsEmptyStateLocal,
} from 'components/interfaces/Functions/FunctionsEmptyState'
import DefaultLayout from 'components/layouts/DefaultLayout'
import EdgeFunctionsLayout from 'components/layouts/EdgeFunctionsLayout/EdgeFunctionsLayout'
import { PageContainer } from 'components/ui/PageContainer'
import { PageHeader } from 'components/ui/PageHeader'
import AlertError from 'components/ui/AlertError'
import { DocsButton } from 'components/ui/DocsButton'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useEdgeFunctionsQuery } from 'data/edge-functions/edge-functions-query'
import { DOCS_URL, IS_PLATFORM } from 'lib/constants'
import type { NextPageWithLayout } from 'types'
import { Button, Card, Table, TableBody, TableHead, TableHeader, TableRow } from 'ui'
import { PageSection } from 'components/ui/PageSection'

const EdgeFunctionsPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const {
    data: functions,
    error,
    isLoading,
    isError,
    isSuccess,
  } = useEdgeFunctionsQuery({ projectRef: ref })

  const hasFunctions = (functions ?? []).length > 0

  return (
    <PageContainer size="large">
      <PageSection.Root>
        {IS_PLATFORM ? (
          <>
            {isLoading && <GenericSkeletonLoader />}
            {isError && <AlertError error={error} subject="Failed to retrieve edge functions" />}
            {isSuccess && (
              <>
                {hasFunctions ? (
                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>URL</TableHead>
                          <TableHead className="hidden 2xl:table-cell">Created</TableHead>
                          <TableHead className="lg:table-cell">Last updated</TableHead>
                          <TableHead className="lg:table-cell">Deployments</TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        <>
                          {functions.length > 0 &&
                            functions.map((item) => (
                              <EdgeFunctionsListItem key={item.id} function={item} />
                            ))}
                        </>
                      </TableBody>
                    </Table>
                  </Card>
                ) : (
                  <FunctionsEmptyState />
                )}
              </>
            )}
          </>
        ) : (
          <FunctionsEmptyStateLocal />
        )}
      </PageSection.Root>
    </PageContainer>
  )
}

EdgeFunctionsPage.getLayout = (page: React.ReactElement) => {
  const EdgeFunctionsPageLayout = () => {
    const secondaryActions = [
      <DocsButton key="docs" href={`${DOCS_URL}/guides/functions`} />,
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
      <div className="w-full min-h-full flex flex-col items-stretch">
        <PageHeader.Root size="large">
          <PageHeader.Summary>
            <PageHeader.Title>Edge Functions</PageHeader.Title>
            <PageHeader.Description>
              Deploy edge functions to handle complex business logic
            </PageHeader.Description>
          </PageHeader.Summary>
          <PageHeader.Aside>
            {secondaryActions.map((action) => action)}
            {IS_PLATFORM && <DeployEdgeFunctionButton />}
          </PageHeader.Aside>
        </PageHeader.Root>

        {page}
      </div>
    )
  }

  return (
    <DefaultLayout>
      <EdgeFunctionsLayout>
        <EdgeFunctionsPageLayout />
      </EdgeFunctionsLayout>
    </DefaultLayout>
  )
}

export default EdgeFunctionsPage
