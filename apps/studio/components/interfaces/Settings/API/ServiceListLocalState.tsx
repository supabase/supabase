import { AlertCircle } from 'lucide-react'

import { useParams } from 'common'
import { ScaffoldSection } from 'components/layouts/Scaffold'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { IS_SELF_HOST, PROJECT_STATUS } from 'lib/constants'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { Alert_Shadcn_, AlertTitle_Shadcn_, Card, CardContent, CardHeader, CardTitle } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormLayout } from 'ui-patterns/form/Layout/FormLayout'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { PostgrestConfigLocalState } from './PostgrestConfigLocalState'
import { DocsButton } from 'components/ui/DocsButton'

export const ServiceListLocalState = () => {
  const { data: project, isLoading } = useSelectedProjectQuery()
  const { ref: projectRef } = useParams()
  const state = useDatabaseSelectorStateSnapshot()
  const {
    data: databases,
    isError,
    isLoading: isLoadingDatabases,
  } = useReadReplicasQuery({ projectRef })

  // Get the API service
  const selectedDatabase = databases?.find((db) => db.identifier === state.selectedDatabaseId)

  const endpoint = selectedDatabase?.restUrl

  return (
    <ScaffoldSection isFullWidth id="api-settings" className="gap-6">
      {!isLoading && project?.status !== PROJECT_STATUS.ACTIVE_HEALTHY ? (
        <Alert_Shadcn_ variant="destructive">
          <AlertCircle size={16} />
          <AlertTitle_Shadcn_>
            API settings are unavailable as the project is not active
          </AlertTitle_Shadcn_>
        </Alert_Shadcn_>
      ) : (
        <>
          {IS_SELF_HOST && (
            <Card>
              <CardHeader>
                <CardTitle>Managing API settings for self-hosted</CardTitle>
              </CardHeader>
              <CardContent className="p-0 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] divide-y md:divide-y-0 md:divide-x divide-default items-stretch">
                <div className="p-8">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base text-foreground">Managing settings</h4>
                  </div>

                  <div className="text-sm text-foreground-light mt-1 mb-4 max-w-3xl">
                    <p className="prose [&>code]:text-xs space-x-1 text-sm max-w-full">
                      <span>API config can be loaded through </span>
                      <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href="https://github.com/supabase/supabase/blob/master/docker/.env.example"
                      >
                        .env file
                      </a>

                      <span>
                        and added inside the <code>rest</code> service in{' '}
                        <code>docker-compose.yml</code>
                      </span>
                    </p>
                  </div>

                  <DocsButton href="https://postgrest.org/en/stable/references/configuration.html" />
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              Project URL
            </CardHeader>
            <CardContent>
              {isLoading || isLoadingDatabases ? (
                <div className="space-y-2">
                  <ShimmeringLoader className="py-3.5" />
                  <ShimmeringLoader className="py-3.5 w-3/4" delayIndex={1} />
                </div>
              ) : isError ? (
                <Alert_Shadcn_ variant="destructive">
                  <AlertCircle size={16} />
                  <AlertTitle_Shadcn_>Failed to retrieve project URL</AlertTitle_Shadcn_>
                </Alert_Shadcn_>
              ) : (
                <FormLayout
                  layout="horizontal"
                  label={'URL'}
                  description={'RESTful endpoint for querying and managing your database'}
                >
                  <Input copy readOnly className="font-mono" value={endpoint} />
                </FormLayout>
              )}
            </CardContent>
          </Card>

          <PostgrestConfigLocalState />
        </>
      )}
    </ScaffoldSection>
  )
}
