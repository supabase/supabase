import { useParams } from 'common'
import { Database } from 'icons'
import { Plus } from 'lucide-react'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useEffect, useState } from 'react'
import { Button, Card, CardContent, Table, TableBody, TableHead, TableHeader, TableRow } from 'ui'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'
import {
  PageSection,
  PageSectionAside,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { AddReadReplicaSheet } from './AddReadReplicaSheet'
import { ReadReplicaRow } from './ReadReplicaRow'
import { REPLICA_STATUS } from './ReadReplicas.constants'
import { AlertError } from '@/components/ui/AlertError'
import { DocsButton } from '@/components/ui/DocsButton'
import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { DOCS_URL } from '@/lib/constants'

export const ReadReplicasSection = () => {
  const { ref: projectRef } = useParams()
  const { infrastructureReadReplicas } = useIsFeatureEnabled(['infrastructure:read_replicas'])
  const [, setAddReplica] = useQueryState(
    'addReplica',
    parseAsBoolean.withDefault(false).withOptions({
      history: 'push',
      clearOnDefault: true,
      scroll: false,
    })
  )

  const [statusRefetchInterval, setStatusRefetchInterval] = useState<number | false>(5000)

  const {
    data: databases = [],
    error: databasesError,
    isPending: isDatabasesLoading,
    isError: isDatabasesError,
    isSuccess: isDatabasesSuccess,
  } = useReadReplicasQuery(
    { projectRef },
    {
      enabled: infrastructureReadReplicas,
      refetchInterval: infrastructureReadReplicas ? statusRefetchInterval : false,
    }
  )

  const readReplicas = databases.filter((database) => database.identifier !== projectRef)
  const hasReplicas = isDatabasesSuccess && readReplicas.length > 0

  useEffect(() => {
    if (!isDatabasesSuccess) return

    const fixedStatuses = [
      REPLICA_STATUS.ACTIVE_HEALTHY,
      REPLICA_STATUS.ACTIVE_UNHEALTHY,
      REPLICA_STATUS.INIT_READ_REPLICA_FAILED,
    ]
    const replicasInTransition = databases.filter(
      (database) => database.identifier !== projectRef && !fixedStatuses.includes(database.status)
    )
    if (replicasInTransition.length === 0) setStatusRefetchInterval(false)
  }, [isDatabasesSuccess, databases, projectRef])

  if (!infrastructureReadReplicas) return null

  return (
    <>
      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Read replicas</PageSectionTitle>
            <PageSectionDescription>
              Scale reads or serve queries closer to users.
            </PageSectionDescription>
          </PageSectionSummary>
          <PageSectionAside>
            <DocsButton href={`${DOCS_URL}/guides/platform/read-replicas`} />
            <Button
              type="button"
              variant="primary"
              icon={<Plus />}
              onClick={() => setAddReplica(true)}
            >
              Add read replica
            </Button>
          </PageSectionAside>
        </PageSectionMeta>

        <PageSectionContent className="flex flex-col gap-y-4">
          {isDatabasesError && (
            <AlertError error={databasesError} subject="Failed to retrieve read replicas" />
          )}

          {isDatabasesLoading && <GenericSkeletonLoader />}

          {isDatabasesSuccess && hasReplicas && (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[20px]" />
                      <TableHead className="w-[250px]">Name</TableHead>
                      <TableHead className="w-[150px]">Status</TableHead>
                      <TableHead className="w-[150px]">Lag</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {readReplicas.map((replica) => (
                      <ReadReplicaRow
                        key={replica.identifier}
                        replica={replica}
                        onUpdateReplica={() => setStatusRefetchInterval(5000)}
                      />
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {isDatabasesSuccess && !hasReplicas && (
            <EmptyStatePresentational
              icon={Database}
              title="No read replicas"
              description="All reads and writes currently go to the primary."
            >
              <Button
                type="button"
                variant="default"
                icon={<Plus />}
                onClick={() => setAddReplica(true)}
              >
                Add read replica
              </Button>
            </EmptyStatePresentational>
          )}
        </PageSectionContent>
      </PageSection>

      <AddReadReplicaSheet onSuccess={() => setStatusRefetchInterval(5000)} />
    </>
  )
}
