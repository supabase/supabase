import type { PropsWithChildren } from 'react'

import { DatabaseLayout } from './DatabaseLayout'
import { PipelineClusterScope } from '@/components/interfaces/Database/Replication/PipelineClusterScope'

export const PipelinesLayout = ({ children }: PropsWithChildren) => (
  <DatabaseLayout title="Pipelines">
    <PipelineClusterScope>{children}</PipelineClusterScope>
  </DatabaseLayout>
)
