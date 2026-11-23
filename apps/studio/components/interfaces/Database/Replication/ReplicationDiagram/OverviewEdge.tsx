import { useQueries } from '@tanstack/react-query'
import { BaseEdge, getSmoothStepPath, type Edge, type EdgeProps } from '@xyflow/react'
import { useParams, useReducedMotion } from 'common'

import { replicationPipelineStatusQueryOptions } from '@/data/replication/pipeline-status-query'
import {
  PipelineStatusRequestStatus,
  usePipelineRequestStatus,
} from '@/state/replication-pipeline-request-status'

export type OverviewEdge = Edge<{
  pipelineId?: string
  clusterId?: string
  pipelines?: { pipelineId: string; clusterId?: string }[]
  hasStatusChip?: boolean
  isConverging?: boolean
  isFinalConnection?: boolean
}>

export function OverviewFlowEdge(props: EdgeProps<OverviewEdge>) {
  const { ref: projectRef } = useParams()
  const prefersReducedMotion = useReducedMotion()
  const { getRequestStatus } = usePipelineRequestStatus()
  const pipelines = props.data?.pipelines ?? []
  const results = useQueries({
    queries: pipelines.map((pipeline) =>
      replicationPipelineStatusQueryOptions({ projectRef, ...pipeline })
    ),
  })
  const isRunning = results.some(
    (result, index) =>
      result.data?.status.name === 'started' &&
      !result.isError &&
      getRequestStatus(pipelines[index].pipelineId) === PipelineStatusRequestStatus.None
  )
  const isStopped =
    pipelines.length > 0 &&
    results.every(
      (result, index) =>
        !result.isError &&
        result.data?.status.name === 'stopped' &&
        getRequestStatus(pipelines[index].pipelineId) === PipelineStatusRequestStatus.None
    )
  const sourceX = props.sourceX + (props.data?.isFinalConnection ? 0 : 4)
  const targetX = props.targetX - (props.data?.isConverging ? 0 : 4)
  const [smoothPath] = getSmoothStepPath({ ...props, sourceX, targetX, offset: 0, borderRadius: 6 })
  const distance = props.targetY - props.sourceY
  const radius = Math.min(6, Math.abs(distance), Math.abs(targetX - sourceX))
  const direction = Math.sign(distance)
  const convergingPath = `M ${sourceX},${props.sourceY} H ${targetX - radius} Q ${targetX},${props.sourceY} ${targetX},${props.sourceY + direction * radius} V ${props.targetY}`
  let path = smoothPath
  if (props.data?.isConverging) path = convergingPath
  if (props.data?.isFinalConnection)
    path = `M ${props.sourceX - 1},${props.sourceY} L ${targetX},${props.targetY}`
  return (
    <BaseEdge
      path={path}
      markerEnd={props.markerEnd}
      style={{
        stroke: 'var(--pipeline-line-color)',
        strokeWidth: 1.5,
        opacity: isStopped ? 0.35 : 1,
        strokeDasharray: isRunning ? '5 5' : undefined,
        animation: isRunning && !prefersReducedMotion ? 'dashdraw 0.5s linear infinite' : undefined,
      }}
    />
  )
}
