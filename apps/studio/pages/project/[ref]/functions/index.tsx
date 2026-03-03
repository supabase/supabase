import { useParams } from 'common'
import { DeployEdgeFunctionButton } from 'components/interfaces/EdgeFunctions/DeployEdgeFunctionButton'
import {
  EDGE_FUNCTIONS_SORT_VALUES,
  EdgeFunctionsSort,
  EdgeFunctionsSortColumn,
  EdgeFunctionsSortDropdown,
  EdgeFunctionsSortOrder,
} from 'components/interfaces/EdgeFunctions/EdgeFunctionsSortDropdown'
import { EdgeFunctionsListItem } from 'components/interfaces/Functions/EdgeFunctionsListItem'
import {
  FunctionsEmptyState,
  FunctionsInstructionsLocal,
} from 'components/interfaces/Functions/FunctionsEmptyState'
import { TerminalInstructionsDialog } from 'components/interfaces/Functions/TerminalInstructionsDialog'
import DefaultLayout from 'components/layouts/DefaultLayout'
import EdgeFunctionsLayout from 'components/layouts/EdgeFunctionsLayout/EdgeFunctionsLayout'
import AlertError from 'components/ui/AlertError'
import { DocsButton } from 'components/ui/DocsButton'
import { useEdgeFunctionsQuery } from 'data/edge-functions/edge-functions-query'
import { DOCS_URL, IS_PLATFORM } from 'lib/constants'
import { ExternalLink, Search, X } from 'lucide-react'
import { parseAsString, parseAsStringLiteral, useQueryState } from 'nuqs'
import React, { useMemo } from 'react'
import type { NextPageWithLayout } from 'types'
import { Button, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'
import { Admonition } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

const EdgeFunctionsPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const {
    data: functions,
    error,
    isPending: isLoading,
    isError,
    isSuccess,
  } = useEdgeFunctionsQuery({ projectRef: ref })

  const [search, setSearch] = useQueryState('search', parseAsString.withDefault(''))
  const [sort, setSortQueryParam] = useQueryState(
    'sort',
    parseAsStringLiteral<EdgeFunctionsSort>(EDGE_FUNCTIONS_SORT_VALUES).withDefault('name:asc')
  )

  const filteredFunctions = useMemo(() => {
    const temp = (functions ?? []).filter((x) =>
      x.name.toLowerCase().includes(search.toLowerCase())
    )
    const [sortCol, sortOrder] = sort.split(':') as [
      EdgeFunctionsSortColumn,
      EdgeFunctionsSortOrder,
    ]
    const orderMultiplier = sortOrder === 'asc' ? 1 : -1

    return temp.sort((a, b) => {
      if (sortCol === 'name') {
        return a.name.localeCompare(b.name) * orderMultiplier
      }
      if (sortCol === 'created_at') {
        return (a.created_at - b.created_at) * orderMultiplier
      }
      if (sortCol === 'updated_at') {
        return (a.updated_at - b.updated_at) * orderMultiplier
      }
      return 0
    })
  }, [functions, search, sort])

  const hasFunctions = (functions ?? []).length > 0

  return (
    <PageContainer size="large">
      <PageSection>
        <PageSectionContent>
          <div className="flex flex-col gap-6">
            {isLoading && <GenericSkeletonLoader />}
            {isError &&
              (IS_PLATFORM ? (
                <AlertError error={error} subject="Failed to retrieve edge functions" />
              ) : (
                <Admonition type="warning" title="Failed to retrieve edge functions">
                  <p className="prose [&>code]:text-xs text-sm">
                    Local functions can be found at <code>supabase/functions</code> folder.
                  </p>
                </Admonition>
              ))}
            {isSuccess && (
              <>
                {hasFunctions ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Input
                            placeholder="Search function names"
                            icon={<Search />}
                            size="tiny"
                            className="w-32 md:w-64"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            actions={[
                              search && (
                                <Button
                                  key="clear"
                                  size="tiny"
                                  type="text"
                                  icon={<X />}
                                  onClick={() => setSearch('')}
                                  className="p-0 h-5 w-5"
                                />
                              ),
                            ]}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <EdgeFunctionsSortDropdown value={sort} onChange={setSortQueryParam} />
                      </div>
                    </div>
                    <Card>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>URL</TableHead>
                            <TableHead className="hidden 2xl:table-cell">Created</TableHead>
                            <TableHead className="lg:table-cell">Updated</TableHead>
                            <TableHead className="lg:table-cell">Deployments</TableHead>
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          <>
                            {filteredFunctions.length > 0 ? (
                              filteredFunctions.map((item) => (
                                <EdgeFunctionsListItem key={item.id} function={item} />
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={5}>
                                  <p className="text-sm text-foreground">No results found</p>
                                  <p className="text-sm text-foreground-light">
                                    Your search for "{search}" did not return any results
                                  </p>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        </TableBody>
                      </Table>
                    </Card>
                  </div>
                ) : (
                  <FunctionsEmptyState />
                )}
              </>
            )}
            {!IS_PLATFORM && <FunctionsInstructionsLocal />}
          </div>
        </PageSectionContent>
      </PageSection>
    </PageContainer>
  )
}

EdgeFunctionsPage.getLayout = (page: React.ReactElement) => {
  return (
    <DefaultLayout>
      <EdgeFunctionsLayout>
        <div className="w-full min-h-full flex flex-col items-stretch">
          <PageHeader size="large">
            <PageHeaderMeta>
              <PageHeaderSummary>
                <PageHeaderTitle>Edge Functions</PageHeaderTitle>
                <PageHeaderDescription>
                  Run server-side logic close to your users
                </PageHeaderDescription>
              </PageHeaderSummary>
              <PageHeaderAside>
                <DocsButton href={`${DOCS_URL}/guides/functions`} />
                <Button asChild type="default" icon={<ExternalLink />}>
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href="https://github.com/supabase/supabase/tree/master/examples/edge-functions/supabase/functions"
                  >
                    Examples
                  </a>
                </Button>
                {IS_PLATFORM && <DeployEdgeFunctionButton />}
              </PageHeaderAside>
            </PageHeaderMeta>
          </PageHeader>

          {page}
        </div>
      </EdgeFunctionsLayout>
      <TerminalInstructionsDialog />
    </DefaultLayout>
  )
}

export default EdgeFunctionsPage
