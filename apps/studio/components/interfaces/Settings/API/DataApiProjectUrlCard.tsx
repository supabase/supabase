import { useParams } from 'common'
import { AlertCircle } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect } from 'react'
import { Alert_Shadcn_, AlertTitle_Shadcn_ } from 'ui'
import {
  PageSection,
  PageSectionAside,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { DatabaseSelector } from '@/components/ui/DatabaseSelector'
import { useCustomDomainsQuery } from '@/data/custom-domains/custom-domains-query'
import { useLoadBalancersQuery } from '@/data/read-replicas/load-balancers-query'
import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useStaticEffectEvent } from '@/hooks/useStaticEffectEvent'
import { useDatabaseSelectorStateSnapshot } from '@/state/database-selector'
import { getApiEndpoint } from '@/components/interfaces/Integrations/DataApi/DataApi.utils'

export const DataApiProjectUrlCard = () => {
  const { isPending: isLoading } = useSelectedProjectQuery()
  const { ref: projectRef } = useParams()
  const state = useDatabaseSelectorStateSnapshot()

  const [querySource, setQuerySource] = useQueryState('source', parseAsString)

  const { data: customDomainData } = useCustomDomainsQuery({ projectRef })
  const {
    data: databases,
    isError,
    isPending: isLoadingDatabases,
  } = useReadReplicasQuery({ projectRef })
  const { data: loadBalancers } = useLoadBalancersQuery({ projectRef })

  const syncSelectedDb = useStaticEffectEvent(() => {
    if (querySource && querySource !== state.selectedDatabaseId) {
      state.setSelectedDatabaseId(querySource)
    }
  })
  useEffect(() => {
    syncSelectedDb()
  }, [syncSelectedDb, querySource, projectRef])

  const selectedDatabase = databases?.find((db) => db.identifier === state.selectedDatabaseId)
  const loadBalancerSelected = state.selectedDatabaseId === 'load-balancer'
  const replicaSelected = selectedDatabase?.identifier !== projectRef

  const endpoint = getApiEndpoint({
    selectedDatabaseId: state.selectedDatabaseId,
    projectRef,
    customDomainData,
    loadBalancers,
    selectedDatabase,
  })

  return (
    <PageSection className="first:pt-0">
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>API URL</PageSectionTitle>
          <PageSectionDescription>
            {loadBalancerSelected
              ? 'RESTful endpoint for querying and managing your databases through your load balancer'
              : replicaSelected
                ? 'RESTful endpoint for querying your read replica'
                : 'RESTful endpoint for querying and managing your database'}
          </PageSectionDescription>
        </PageSectionSummary>
        <PageSectionAside>
          <DatabaseSelector
            additionalOptions={
              (loadBalancers ?? []).length > 0
                ? [{ id: 'load-balancer', name: 'API Load Balancer' }]
                : []
            }
            onSelectId={() => {
              setQuerySource(null)
            }}
          />
        </PageSectionAside>
      </PageSectionMeta>
      <PageSectionContent>
        {isLoading || isLoadingDatabases ? (
          <div className="space-y-2">
            <ShimmeringLoader />
            <ShimmeringLoader className="w-3/4" delayIndex={1} />
          </div>
        ) : isError ? (
          <Alert_Shadcn_ variant="destructive">
            <AlertCircle size={16} />
            <AlertTitle_Shadcn_>Failed to retrieve project URL</AlertTitle_Shadcn_>
          </Alert_Shadcn_>
        ) : (
          <Input copy readOnly className="font-mono" value={endpoint} />
        )}
      </PageSectionContent>
    </PageSection>
  )
}
