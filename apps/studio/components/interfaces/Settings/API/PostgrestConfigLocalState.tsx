import Link from 'next/link'

import { useParams } from 'common'
import { DocsButton } from 'components/ui/DocsButton'
import { useProjectPostgrestConfigQuery } from 'data/config/project-postgrest-config-query'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import { Badge, Button, Card, CardContent, CardHeader, Input_Shadcn_, Skeleton, cn } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'
import { Admonition } from 'ui-patterns/admonition'
import { FormLayout } from 'ui-patterns/form/Layout/FormLayout'

export const PostgrestConfigLocalState = () => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const {
    data: config,
    isError,
    isLoading: isLoadingConfig,
  } = useProjectPostgrestConfigQuery({ projectRef })
  const { data: extensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { data: allSchemas = [], isLoading: isLoadingSchemas } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const isLoading = isLoadingConfig || isLoadingSchemas

  const isGraphqlExtensionEnabled =
    (extensions ?? []).find((ext) => ext.name === 'pg_graphql')?.installed_version !== null

  const dbSchema = config?.db_schema ? config?.db_schema.replace(/ /g, '').split(',') : []
  const defaultValues = {
    dbSchema,
    maxRows: config?.max_rows,
    dbExtraSearchPath: (config?.db_extra_search_path ?? '')
      .split(',')
      .map((x) => x.trim())
      .filter((x) => x.length > 0 && allSchemas.find((y) => y.name === x)),
    dbPool: config?.db_pool,
  }

  return (
    <Card id="postgrest-config">
      <CardHeader className="flex-row items-center justify-between">
        Data API
        <div className="flex items-center gap-x-2">
          <DocsButton href={`${DOCS_URL}/guides/database/connecting-to-postgres#data-apis`} />
        </div>
      </CardHeader>
      <CardContent className={cn(!isLoading ? 'p-0' : '')}>
        {isLoading ? (
          <GenericSkeletonLoader />
        ) : isError ? (
          <Admonition type="destructive" title="Failed to retrieve API settings" />
        ) : (
          <>
            <FormLayout
              label="Exposed schemas"
              description="The schemas to expose in your API. Tables, views and stored procedures in
                          these schemas will get API endpoints."
              layout="horizontal"
              className="px-8 py-8"
            >
              {isLoadingSchemas ? (
                <div className="col-span-12 flex flex-col gap-2 lg:col-span-7">
                  <Skeleton className="w-full h-[38px]" />
                </div>
              ) : (
                <div
                  className={cn(
                    'flex w-full min-w-[200px] min-h-[40px] items-center justify-between rounded-md border',
                    'border-alternative bg-foreground/[.026] px-3 py-2 text-sm'
                  )}
                >
                  <div
                    className={cn(
                      'flex gap-1 -ml-1 overflow-hidden flex-1',
                      'flex-wrap',
                      'overflow-x-auto scrollbar-thin scrollbar-track-transparent transition-colors scrollbar-thumb-muted-foreground dark:scrollbar-thumb-muted scrollbar-thumb-rounded-lg'
                    )}
                  >
                    {defaultValues.dbSchema.map((value) => (
                      <Badge key={value} className="rounded shrink-0 px-1.5">
                        {value}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {!defaultValues.dbSchema.includes('public') && defaultValues.dbSchema.length > 0 && (
                <Admonition
                  type="default"
                  title="The public schema for this project is not exposed"
                  className="mt-2"
                  description={
                    <>
                      <p className="prose text-sm">
                        You will not be able to query tables and views in the{' '}
                        <code className="text-xs">public</code> schema via supabase-js or HTTP
                        clients.
                      </p>
                      {isGraphqlExtensionEnabled && (
                        <>
                          <p className="prose text-sm mt-2">
                            Tables in the <code className="text-xs">public</code> schema are still
                            exposed over our GraphQL endpoints.
                          </p>
                          <Button asChild type="default" className="mt-2">
                            <Link href={`/project/${projectRef}/database/extensions`}>
                              Disable the pg_graphql extension
                            </Link>
                          </Button>
                        </>
                      )}
                    </>
                  }
                />
              )}
            </FormLayout>

            <FormLayout
              className="w-full px-8 py-8"
              layout="horizontal"
              label="Max rows"
              description="The maximum number of rows returned from a view, table, or stored procedure. Limits payload size for accidental or malicious requests."
            >
              <Input_Shadcn_ readOnly className="font-mono" value={defaultValues.maxRows} />
            </FormLayout>
          </>
        )}
      </CardContent>
    </Card>
  )
}
