import '@xyflow/react/dist/style.css'

import { useQueries } from '@tanstack/react-query'
import { Background, MarkerType, ReactFlow } from '@xyflow/react'
import { useParams } from 'common'
import { useTheme } from 'next-themes'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { AWS_REGIONS } from 'shared-data'

import { useReplicationClusters } from '../useReplicationClusters'
import { getOverviewDestination } from './Overview.utils'
import { OverviewFlowEdge, type OverviewEdge } from './OverviewEdge'
import {
  OverviewCard,
  OverviewDestination,
  OverviewGroup,
  OverviewJunction,
  OverviewPipelineStatus,
  OverviewRegion,
  PipelineLink,
  type OverviewNode,
} from './OverviewNodes'
import { replicationDestinationsQueryOptions } from '@/data/replication/destinations-query'
import { replicationPipelinesQueryOptions } from '@/data/replication/pipelines-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

const MAX_VISIBLE_PIPELINES = 4
const nodeTypes = {
  overview: OverviewCard,
  overviewGroup: OverviewGroup,
  junction: OverviewJunction,
}
const edgeTypes = { flow: OverviewFlowEdge }
const diagramStyle: CSSProperties & { '--pipeline-line-color': string } = {
  '--pipeline-line-color':
    'color-mix(in srgb, oklch(from var(--foreground-default) l c h / 1) 22%, oklch(from var(--background-default) l c h / 1))',
}
const markerEnd = {
  type: MarkerType.ArrowClosed,
  color: 'var(--pipeline-line-color)',
  markerUnits: 'userSpaceOnUse',
  width: 16,
  height: 16,
}

export const ReplicationDiagram = ({
  pipelineId,
  clusterId: selectedClusterId,
}: { pipelineId?: string; clusterId?: string } = {}) => {
  const isDetail = pipelineId !== undefined
  const { ref: projectRef } = useParams()
  const { clusters } = useReplicationClusters()
  const availableGroups = clusters.map(({ clusterId, isDefault, regionName, regionCode }) => ({
    clusterId: isDefault ? undefined : clusterId,
    region: { region_name: regionName, region_code: regionCode },
  }))
  const groups = pipelineId
    ? availableGroups.filter(({ clusterId }) => clusterId === selectedClusterId)
    : availableGroups
  const { data: project } = useSelectedProjectQuery()
  const pipelineResults = useQueries({
    queries: groups.map(({ clusterId }) =>
      replicationPipelinesQueryOptions({ projectRef, clusterId })
    ),
  })
  const destinationResults = useQueries({
    queries: groups.map(({ clusterId }) =>
      replicationDestinationsQueryOptions({ projectRef, clusterId })
    ),
  })
  const pipelineCount = pipelineResults.reduce(
    (count, result) =>
      count +
      (result.data?.pipelines.filter((pipeline) => !pipelineId || pipeline.id === pipelineId)
        .length ?? 0),
    0
  )
  const isCompact = pipelineCount > MAX_VISIBLE_PIPELINES
  const regions = groups.flatMap(({ clusterId, region }, index) => {
    const pipelines = (pipelineResults[index].data?.pipelines ?? []).filter(
      (pipeline) => !pipelineId || pipeline.id === pipelineId
    )
    const destinations = destinationResults[index].data?.destinations ?? []
    if (!pipelines.length) return []
    return [
      {
        id: `region:${clusterId ?? 'default'}`,
        clusterId,
        region,
        entries: pipelines.map((pipeline) => ({
          pipeline,
          destination: getOverviewDestination({
            destination: destinations.find(({ id }) => id === pipeline.destination_id),
            destinationId: pipeline.destination_id,
            clusterId,
          }),
        })),
      },
    ]
  })
  if (!projectRef || !regions.length) return null

  const destinations = [
    ...new Map(
      regions.flatMap(({ entries }) =>
        entries.map(({ destination }) => [destination.id, destination] as const)
      )
    ).values(),
  ]
  const regionHeights = regions.map(({ entries }) => (isCompact ? 88 : 48 + entries.length * 64))
  const regionsHeight = regionHeights.reduce((total, height) => total + height + 32, -32)
  const destinationsHeight = (destinations.length - 1) * 112 + 64
  const contentHeight = Math.max(regionsHeight, destinationsHeight)
  const sourceRegion = Object.values(AWS_REGIONS).find(({ code }) => code === project?.region)
  const nodes: OverviewNode[] = [
    {
      id: 'source',
      type: 'overview',
      position: { x: 0, y: 0 },
      width: 250,
      height: 88,
      data: {
        kind: 'source',
        sourceHandles: [{ id: 'source', top: 32 }],
        content: (
          <>
            <OverviewRegion
              name={
                sourceRegion?.displayName.match(/\(([^)]+)\)$/)?.[1] ??
                sourceRegion?.displayName ??
                project?.region
              }
              code={project?.region}
            />
            <div className="border-t border-muted pt-3 text-sm">Primary database</div>
          </>
        ),
      },
    },
  ]
  const edges: OverviewEdge[] = []
  let regionY = 0
  regions.forEach(({ id, clusterId, region, entries }, index) => {
    nodes.push({
      id,
      type: 'overview',
      position: { x: 290, y: regionY },
      width: 250,
      height: regionHeights[index],
      data: {
        kind: 'pipeline',
        targetHandles: [{ id: 'detail', top: 32 }],
        sourceHandles: isCompact
          ? undefined
          : entries.map(({ pipeline }, index) => ({
              id: pipeline.id,
              top: pipelineId ? 32 : 77 + index * 64,
            })),
        content: (
          <>
            <OverviewRegion name={region?.region_name} code={region?.region_code ?? undefined} />
            {isCompact ? (
              <p className="border-t border-muted px-1 pt-3 pb-1 text-foreground-light">{`${entries.length} ${entries.length === 1 ? 'pipeline' : 'pipelines'}`}</p>
            ) : (
              <div className="border-t border-muted">
                {entries.map(({ pipeline }) => (
                  <div
                    key={pipeline.id}
                    className="flex h-16 flex-col justify-center border-b border-muted border-dotted last:h-14 last:justify-end last:border-b-0"
                  >
                    {pipelineId ? (
                      <div className="flex h-12 flex-col justify-center gap-0.25 px-2">
                        <span className="truncate font-medium">{pipeline.destination_name}</span>
                        <OverviewPipelineStatus pipelineId={pipeline.id} clusterId={clusterId} />
                      </div>
                    ) : (
                      <PipelineLink
                        projectRef={projectRef}
                        clusterId={clusterId}
                        id={pipeline.id}
                        name={pipeline.destination_name}
                      >
                        <OverviewPipelineStatus pipelineId={pipeline.id} clusterId={clusterId} />
                      </PipelineLink>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        ),
      },
    })
    regionY += regionHeights[index] + 32
    edges.push({
      id: `source:${id}`,
      source: 'source',
      target: id,
      targetHandle: 'detail',
      type: 'flow',
      markerEnd,
      data: { clusterId },
    })
    const connections = isCompact
      ? [
          ...new Map(
            entries.map(({ destination }) => [
              destination.id,
              { destination, pipelineId: undefined },
            ])
          ).values(),
        ]
      : entries.map(({ destination, pipeline }) => ({
          destination,
          pipelineId: pipeline.id,
        }))
    connections.forEach(({ destination, pipelineId }) => {
      edges.push({
        id: `${id}:${pipelineId ?? 'all'}:${destination.id}`,
        source: id,
        sourceHandle: pipelineId,
        target: isDetail ? destination.id : `${destination.id}:junction`,
        markerEnd: isDetail ? markerEnd : undefined,
        targetHandle: isDetail ? 'detail' : undefined,
        type: 'flow',
        data: {
          pipelineId,
          clusterId,
          hasStatusChip: false,
          shouldAnimate: !isCompact,
          isConverging: !isDetail,
          pipelines: entries
            .filter((entry) => entry.destination.id === destination.id)
            .map(({ pipeline }) => ({ pipelineId: pipeline.id, clusterId })),
        },
      })
    })
  })
  destinations.forEach((destination, index) => {
    const destinationY = index * 112
    if (!pipelineId) {
      nodes.push({
        id: `${destination.id}:junction`,
        type: 'junction',
        position: { x: 560, y: destinationY + 60 },
        width: 1,
        height: 1,
        data: { kind: 'junction', content: null },
      })
      edges.push({
        id: `${destination.id}:incoming`,
        source: `${destination.id}:junction`,
        target: destination.id,
        targetHandle: 'detail',
        type: 'flow',
        markerEnd,
        data: {
          isFinalConnection: true,
          shouldAnimate: !isCompact,
          pipelines: regions.flatMap(({ entries, clusterId }) =>
            entries
              .filter((entry) => entry.destination.id === destination.id)
              .map(({ pipeline }) => ({ pipelineId: pipeline.id, clusterId }))
          ),
        },
      })
    }
    nodes.push({
      id: destination.id,
      type: 'overview',
      position: { x: 580, y: destinationY },
      width: 250,
      height: 64,
      data: {
        kind: 'destination',
        targetHandles: [{ id: 'detail', top: 32 }],
        content: (
          <>
            <OverviewDestination type={destination.type} label={destination.label} />
          </>
        ),
      },
    })
  })

  const columns = [
    {
      id: 'source-group',
      label: 'Source',
      kind: 'source',
      x: 0,
      width: 250,
      height: 88,
    },
    {
      id: 'region-group',
      label: pipelineCount === 1 ? 'Pipeline' : 'Pipelines',
      kind: 'pipeline',
      x: 290,
      width: 250,
      height: regionsHeight,
    },
    {
      id: 'destination-group',
      label: destinations.length === 1 ? 'Destination' : 'Destinations',
      kind: 'destination',
      x: 580,
      width: 250,
      height: destinationsHeight,
    },
  ]
  const groupedNodes: OverviewNode[] = columns.map((column) => ({
    id: column.id,
    type: 'overviewGroup',
    position: { x: column.x, y: 0 },
    width: column.width,
    height: 32,
    style: { width: column.width, height: 32 },
    data: { kind: 'group', content: column.label },
    selectable: false,
  }))
  nodes.forEach((node) => {
    const column = columns.find(({ kind }) => kind === node.data.kind)
    if (!column) {
      groupedNodes.push(node)
      return
    }
    groupedNodes.push({
      ...node,
      parentId: column.id,
      position: {
        x: 0,
        y: node.position.y + 28,
      },
    })
  })

  return (
    <section
      aria-label="Pipeline overview"
      className="instance-configuration overflow-x-auto rounded-md border border-muted"
      style={diagramStyle}
    >
      <OverviewGraph nodes={groupedNodes} edges={edges} height={contentHeight + 28 + 24 * 2 + 8} />
    </section>
  )
}

function OverviewGraph({
  nodes,
  edges,
  height,
}: {
  nodes: OverviewNode[]
  edges: OverviewEdge[]
  height: number
}) {
  const { resolvedTheme } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(894)
  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  const canvasStyle: CSSProperties & {
    '--pipeline-canvas-color': string
    '--pipeline-dark-card-color': string
  } = {
    '--pipeline-dark-card-color':
      'color-mix(in srgb, oklch(from var(--foreground-default) l c h / 1) 9%, oklch(from var(--background-default) l c h / 1))',
    '--pipeline-canvas-color': `color-mix(in srgb, oklch(from var(--foreground-default) l c h / 1) ${resolvedTheme === 'dark' ? '4%' : '1.5%'}, oklch(from var(--background-default) l c h / 1))`,
  }
  const backgroundPatternColor =
    resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.4)'
  return (
    <div ref={containerRef} className="min-w-[894px] w-full" style={canvasStyle}>
      <div className="w-full">
        <div style={{ height }}>
          <ReactFlow
            key={nodes.map(({ id }) => id).join(',')}
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            colorMode={resolvedTheme === 'dark' ? 'dark' : 'light'}
            viewport={{ x: Math.max(32, (width - 830) / 2), y: 24, zoom: 1 }}
            panOnDrag={false}
            panOnScroll={false}
            panActivationKeyCode={null}
            zoomActivationKeyCode={null}
            zoomOnScroll={false}
            zoomOnPinch={false}
            zoomOnDoubleClick={false}
            nodesDraggable={false}
            nodesConnectable={false}
            nodesFocusable={false}
            autoPanOnNodeFocus={false}
            edgesFocusable={false}
            elementsSelectable={false}
            disableKeyboardA11y
            preventScrolling={false}
            proOptions={{ hideAttribution: true }}
          >
            <Background
              bgColor="var(--pipeline-canvas-color)"
              color={backgroundPatternColor}
              gap={18}
              size={0.9}
            />
          </ReactFlow>
        </div>
      </div>
    </div>
  )
}
