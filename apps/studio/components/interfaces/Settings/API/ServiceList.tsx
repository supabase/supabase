import { AlertCircle } from 'lucide-react'

import { useParams } from 'common'
import { ScaffoldSection } from 'components/layouts/Scaffold'
import DatabaseSelector from 'components/ui/DatabaseSelector'
import { useCustomDomainsQuery } from 'data/custom-domains/custom-domains-query'
import { useLoadBalancersQuery } from 'data/read-replicas/load-balancers-query'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { Alert_Shadcn_, AlertTitle_Shadcn_, Badge, Card, CardContent, CardHeader } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormLayout } from 'ui-patterns/form/Layout/FormLayout'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { PostgrestConfig } from './PostgrestConfig'

export const ServiceList = () => {
  const { data: project, isLoading } = useSelectedProjectQuery()
  const { ref: projectRef } = useParams()
  const state = useDatabaseSelectorStateSnapshot()

  const { data: customDomainData } = useCustomDomainsQuery({ projectRef })
  const {
    data: databases,
    isError,
    isLoading: isLoadingDatabases,
  } = useReadReplicasQuery({ projectRef })
  const { data: loadBalancers } = useLoadBalancersQuery({ projectRef })

  // Get the API service
  const isCustomDomainActive = customDomainData?.customDomain?.status === 'active'
  const selectedDatabase = databases?.find((db) => db.identifier === state.selectedDatabaseId)
  const loadBalancerSelected = state.selectedDatabaseId === 'load-balancer'
  const replicaSelected = selectedDatabase?.identifier !== projectRef

  const endpoint =
    isCustomDomainActive && state.selectedDatabaseId === projectRef
      ? `https://${customDomainData.customDomain.hostname}`
      : loadBalancerSelected
        ? loadBalancers?.[0].endpoint ?? ''
        : selectedDatabase?.restUrl

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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              Project URL
              <DatabaseSelector
                additionalOptions={
                  (loadBalancers ?? []).length > 0
                    ? [{ id: 'load-balancer', name: 'API Load Balancer' }]
                    : []
                }
              />
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
                  label={
                    isCustomDomainActive ? (
                      <div className="flex items-center space-x-2">
                        <p>URL</p>
                        <Badge>Custom domain active</Badge>
                      </div>
                    ) : (
                      'URL'
                    )
                  }
                  description={
                    loadBalancerSelected
                      ? 'RESTful endpoint for querying and managing your databases through your load balancer'
                      : replicaSelected
                        ? 'RESTful endpoint for querying your read replica'
                        : 'RESTful endpoint for querying and managing your database'
                  }
                >
                  <Input copy readOnly disabled className="input-mono" value={endpoint} />
                </FormLayout>
              )}
            </CardContent>
          </Card>

          <PostgrestConfig />
        </>
      )}
    </ScaffoldSection>
  )
}
