import { noop } from 'lodash'
import Link from 'next/link'

import { useParams } from 'common'
import { FormattedWrapperTable } from 'components/interfaces/Integrations/Wrappers/Wrappers.utils'
import {
  ScaffoldHeader,
  ScaffoldSectionDescription,
  ScaffoldSectionTitle,
} from 'components/layouts/Scaffold'
import { useReplicationPipelineStatusQuery } from 'data/etl/pipeline-status-query'
import { Button } from 'ui'
import { ConnectTablesDialog } from './ConnectTablesDialog'
import { useAnalyticsBucketAssociatedEntities } from './useAnalyticsBucketAssociatedEntities'

interface BucketHeaderProps {
  showActions?: boolean
  namespaces?: {
    namespace: string
    schema: string
    tables: FormattedWrapperTable[]
  }[]
  onSuccessConnectTables?: () => void
}

export const BucketHeader = ({
  showActions = true,
  namespaces = [],
  onSuccessConnectTables = noop,
}: BucketHeaderProps) => {
  const { ref: projectRef, bucketId } = useParams()

  const { pipeline } = useAnalyticsBucketAssociatedEntities({ projectRef, bucketId })
  const { data } = useReplicationPipelineStatusQuery({ projectRef, pipelineId: pipeline?.id })
  const pipelineStatus = data?.status.name
  const isPipelineRunning = pipelineStatus === 'started'

  return (
    <ScaffoldHeader className="pt-0 flex flex-row justify-between items-end gap-x-8">
      <div>
        <ScaffoldSectionTitle>Tables</ScaffoldSectionTitle>
        <ScaffoldSectionDescription>
          Analytics tables stored in this bucket
        </ScaffoldSectionDescription>
      </div>
      {showActions && (
        <div className="flex items-center gap-x-2">
          {!!pipeline && isPipelineRunning && (
            <Button asChild type="default">
              <Link href={`/project/${projectRef}/database/etl/${pipeline.replicator_id}`}>
                View replication
              </Link>
            </Button>
          )}
          {namespaces.length > 0 && (
            <ConnectTablesDialog onSuccessConnectTables={onSuccessConnectTables} />
          )}
        </div>
      )}
    </ScaffoldHeader>
  )
}
