import type { Edge, Node } from '@xyflow/react'

import {
  COMPUTE_SIZE_OPTIONS,
  getMultigresSkuOption,
  type InfrastructureMockConfig,
  type TableGroup,
} from '../Infrastructure.mock'

export type DiagramNodeStatus = 'healthy' | 'warning' | 'error'

export type DiagramShard = {
  id: string
  label: string
  primary: {
    label: string
    region: string
    computeSize: string
    status: DiagramNodeStatus
  }
  replicas: {
    label: string
    region: string
    status: DiagramNodeStatus
  }[]
}

export type DiagramTableGroup = {
  id: string
  name: string
  shards: DiagramShard[]
}

const NODE_W = 240
const FALLBACK_PRIMARY_NODE_H = 72
const FALLBACK_REPLICA_NODE_H = 52
const REPLICA_GAP = 8
const GROUP_PAD = 20
const ROW_GAP = 20
const GATEWAY_MIN_W = 300
const GATEWAY_H = 52
const GATEWAY_GAP = 24
const TABLE_GROUP_GAP = 32

export type InfrastructureDiagramEdgeStyles = {
  dim: { style: { stroke: string; strokeWidth: number } }
  replica: { animated: true; style: { stroke: string; strokeWidth: number } }
}

export const getInfrastructureDiagramEdgeStyles = (
  isDark: boolean
): InfrastructureDiagramEdgeStyles => ({
  dim: {
    style: {
      stroke: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)',
      strokeWidth: 1,
    },
  },
  replica: {
    animated: true,
    style: {
      stroke: 'hsl(var(--brand-default))',
      strokeWidth: 1.5,
    },
  },
})

export const formatComputeSizeLabel = (value: string) => {
  const option = COMPUTE_SIZE_OPTIONS.find((o) => o.value === value)
  if (!option) return value
  return `${option.label} (${option.specs})`
}

export const formatMultigresSkuLabel = (value: string) => {
  const option = getMultigresSkuOption(value)
  if (!option) return value
  return `${option.label} (${option.specs})`
}

export const getDiagramReplicas = (config: InfrastructureMockConfig) => {
  if (config.replicas !== undefined) return config.replicas
  if (!config.availability.enabled) return []

  if (config.availability.level === 'regional') {
    return config.regions
      .filter((region) => region !== config.homeRegion)
      .map((region, index) => ({
        region,
        label: `Read Replica ${index + 1}`,
        status: 'healthy' as const,
      }))
  }

  return [
    {
      region: config.homeRegion,
      label: 'Read Replica (AZ-a)',
      status: 'healthy' as const,
    },
    {
      region: config.homeRegion,
      label: 'Read Replica (AZ-b)',
      status: 'healthy' as const,
    },
  ]
}

export const getTableGroupDiagramId = (name: string) =>
  `table-group-${
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'default'
  }`

const buildDiagramShardsForTableGroup = (
  tableGroupId: string,
  shardCount: number,
  config: InfrastructureMockConfig
): DiagramShard[] => {
  const replicas = getDiagramReplicas(config)
  const computeSize = config.scaling.enabled
    ? formatMultigresSkuLabel(config.scaling.multigresSku)
    : formatComputeSizeLabel(config.scaling.computeSize)

  return Array.from({ length: shardCount }, (_, index) => {
    const shardNumber = index + 1
    return {
      id: `${tableGroupId}-shard-${shardNumber}`,
      label: shardCount > 1 ? `Shard ${shardNumber}` : 'Shard 1',
      primary: {
        label: 'Main Database',
        region: config.homeRegion,
        computeSize,
        status: 'healthy',
      },
      replicas,
    }
  })
}

const toDiagramTableGroup = (
  tableGroup: TableGroup,
  config: InfrastructureMockConfig
): DiagramTableGroup => {
  const id = getTableGroupDiagramId(tableGroup.name)
  const shardCount = config.scaling.enabled ? Math.max(1, tableGroup.shards) : 1

  return {
    id,
    name: tableGroup.name,
    shards: buildDiagramShardsForTableGroup(id, shardCount, config),
  }
}

/** @deprecated Use buildDiagramTableGroups — kept for callers migrating incrementally. */
export const buildDiagramShards = (config: InfrastructureMockConfig): DiagramShard[] => {
  const tableGroups = buildDiagramTableGroups(config)
  return tableGroups[0]?.shards ?? buildDiagramShardsForTableGroup('default', 1, config)
}

export const buildDiagramTableGroups = (config: InfrastructureMockConfig): DiagramTableGroup[] => {
  if (!config.scaling.enabled) {
    return [
      {
        id: 'default',
        name: 'Database',
        shards: buildDiagramShardsForTableGroup('default', 1, config),
      },
    ]
  }

  if (config.scaling.tableGroups.length === 0) {
    return [
      {
        id: 'default',
        name: 'Table group',
        shards: buildDiagramShardsForTableGroup('default', 1, config),
      },
    ]
  }

  return config.scaling.tableGroups.map((tableGroup) => toDiagramTableGroup(tableGroup, config))
}

type DiagramLayoutDimensions = {
  groupW: number
  groupH: number
  primaryX: number
  primaryY: number
  replicasY: number
  replicasStartX: number
}

type GatewayLayout = {
  totalWidth: number
  gatewayW: number
  gatewayX: number
}

type ShardContainerLayout = {
  containerW: number
  containerX: number
  containerH: number
  primaryX: number
  primaryY: number
  replicasY: number
  replicasStartX: number
}

const getDiagramLayoutDimensions = ({
  replicaCount,
  primaryHeight,
  replicaHeight,
  containerW,
}: {
  replicaCount: number
  primaryHeight: number
  replicaHeight: number
  containerW?: number
}): DiagramLayoutDimensions => {
  const replicasRowW = replicaCount * NODE_W + Math.max(0, replicaCount - 1) * REPLICA_GAP
  const innerW = Math.max(NODE_W, replicasRowW)
  const groupW = innerW + GROUP_PAD * 2
  const layoutW = containerW ?? groupW
  const groupH =
    replicaCount > 0
      ? GROUP_PAD + primaryHeight + ROW_GAP + replicaHeight + GROUP_PAD
      : GROUP_PAD + primaryHeight + GROUP_PAD
  const primaryX = layoutW / 2 - NODE_W / 2
  const primaryY = GROUP_PAD
  const replicasY = primaryY + primaryHeight + ROW_GAP
  const replicasStartX = (layoutW - replicasRowW) / 2

  return {
    groupW,
    groupH,
    primaryX,
    primaryY,
    replicasY,
    replicasStartX,
  }
}

const getGatewayLayout = (layouts: Pick<DiagramLayoutDimensions, 'groupW'>[]): GatewayLayout => {
  const totalWidth =
    layouts.reduce((width, layout) => width + layout.groupW, 0) +
    Math.max(0, layouts.length - 1) * TABLE_GROUP_GAP
  const gatewayW = Math.max(GATEWAY_MIN_W, totalWidth)
  const gatewayX = (totalWidth - gatewayW) / 2

  return { totalWidth, gatewayW, gatewayX }
}

const getShardGroupId = (activeShardId: string) => `${activeShardId}-group`

const getShardContainerLayout = ({
  layout,
  tableGroupCount,
  gatewayW,
  gatewayX,
  offsetX,
  primaryHeight,
  replicaHeight,
  replicaCount,
}: {
  layout: DiagramLayoutDimensions
  tableGroupCount: number
  gatewayW: number
  gatewayX: number
  offsetX: number
  primaryHeight: number
  replicaHeight: number
  replicaCount: number
}): ShardContainerLayout | null => {
  if (replicaCount === 0) return null

  const containerW = tableGroupCount === 1 ? gatewayW : layout.groupW
  const containerX = tableGroupCount === 1 ? gatewayX : offsetX
  const childLayout = getDiagramLayoutDimensions({
    replicaCount,
    primaryHeight,
    replicaHeight,
    containerW,
  })

  return {
    containerW,
    containerX,
    containerH: childLayout.groupH,
    primaryX: childLayout.primaryX,
    primaryY: childLayout.primaryY,
    replicasY: childLayout.replicasY,
    replicasStartX: childLayout.replicasStartX,
  }
}

const getNodeMeasuredHeight = (node: Node | undefined, fallback: number) =>
  node?.measured?.height ?? fallback

type TableGroupLayout = DiagramLayoutDimensions & {
  tableGroupId: string
  activeShardId: string
  replicaCount: number
  offsetX: number
  groupY: number
}

const buildTableGroupLayouts = ({
  nodes,
  tableGroups,
  activeShardByGroup,
  useMeasuredHeights,
}: {
  nodes: Node[]
  tableGroups: DiagramTableGroup[]
  activeShardByGroup: Record<string, string>
  useMeasuredHeights: boolean
}): TableGroupLayout[] => {
  let offsetX = 0
  const groupY = GATEWAY_H + GATEWAY_GAP

  return tableGroups.map((tableGroup) => {
    const activeShardId =
      activeShardByGroup[tableGroup.id] ?? tableGroup.shards[0]?.id ?? `${tableGroup.id}-shard-1`
    const activeShard =
      tableGroup.shards.find((shard) => shard.id === activeShardId) ?? tableGroup.shards[0]
    const replicaCount = activeShard?.replicas.length ?? 0
    const primaryId = `${activeShardId}-primary`
    const replicaNodes = nodes
      .filter((node) => node.id.startsWith(`${activeShardId}-replica-`))
      .sort((a, b) => a.id.localeCompare(b.id))

    const primaryNode = nodes.find((node) => node.id === primaryId)
    const primaryHeight = useMeasuredHeights
      ? getNodeMeasuredHeight(primaryNode, FALLBACK_PRIMARY_NODE_H)
      : FALLBACK_PRIMARY_NODE_H
    const replicaHeight =
      replicaCount > 0
        ? useMeasuredHeights && replicaNodes.length > 0
          ? Math.max(
              ...replicaNodes.map((node) => getNodeMeasuredHeight(node, FALLBACK_REPLICA_NODE_H))
            )
          : FALLBACK_REPLICA_NODE_H
        : 0

    const layout = getDiagramLayoutDimensions({
      replicaCount,
      primaryHeight,
      replicaHeight,
    })

    const positioned: TableGroupLayout = {
      ...layout,
      tableGroupId: tableGroup.id,
      activeShardId,
      replicaCount,
      offsetX,
      groupY,
    }

    offsetX += layout.groupW + TABLE_GROUP_GAP
    return positioned
  })
}

const applyTableGroupLayoutToNode = (
  node: Node,
  layout: TableGroupLayout,
  activeShardId: string,
  tableGroupCount: number,
  gateway: GatewayLayout,
  primaryHeight: number,
  replicaHeight: number
): Node | null => {
  const primaryId = `${activeShardId}-primary`
  const replicaPrefix = `${activeShardId}-replica-`
  const groupId = getShardGroupId(activeShardId)
  const containerLayout = getShardContainerLayout({
    layout,
    tableGroupCount,
    gatewayW: gateway.gatewayW,
    gatewayX: gateway.gatewayX,
    offsetX: layout.offsetX,
    primaryHeight,
    replicaHeight,
    replicaCount: layout.replicaCount,
  })

  if (node.id === groupId) {
    if (!containerLayout) return null

    return {
      ...node,
      position: { x: containerLayout.containerX, y: layout.groupY },
      style: {
        ...node.style,
        width: containerLayout.containerW,
        height: containerLayout.containerH,
      },
    }
  }

  if (node.id === primaryId) {
    if (containerLayout) {
      return {
        ...node,
        parentId: groupId,
        extent: 'parent',
        position: { x: containerLayout.primaryX, y: containerLayout.primaryY },
        style: { width: NODE_W },
      }
    }

    return {
      ...node,
      parentId: undefined,
      extent: undefined,
      position: { x: layout.offsetX + layout.primaryX, y: layout.groupY + layout.primaryY },
      style: { width: NODE_W },
    }
  }

  if (node.id.startsWith(replicaPrefix)) {
    const replicaIndex = Number.parseInt(node.id.slice(replicaPrefix.length), 10)
    if (Number.isNaN(replicaIndex)) return null

    if (containerLayout) {
      return {
        ...node,
        parentId: groupId,
        extent: 'parent',
        position: {
          x: containerLayout.replicasStartX + replicaIndex * (NODE_W + REPLICA_GAP),
          y: containerLayout.replicasY,
        },
        style: { width: NODE_W },
      }
    }

    return {
      ...node,
      parentId: undefined,
      extent: undefined,
      position: {
        x: layout.offsetX + layout.replicasStartX + replicaIndex * (NODE_W + REPLICA_GAP),
        y: layout.groupY + layout.replicasY,
      },
      style: { width: NODE_W },
    }
  }

  return null
}

export const relayoutDiagramNodes = (
  nodes: Node[],
  tableGroups: DiagramTableGroup[],
  activeShardByGroup: Record<string, string>
): Node[] => {
  const layouts = buildTableGroupLayouts({
    nodes,
    tableGroups,
    activeShardByGroup,
    useMeasuredHeights: true,
  })

  const gateway = getGatewayLayout(layouts)

  return nodes.map((node) => {
    if (node.id === 'multigateway') {
      return {
        ...node,
        position: { x: gateway.gatewayX, y: 0 },
        style: { ...node.style, width: gateway.gatewayW, height: GATEWAY_H },
      }
    }

    for (const layout of layouts) {
      const primaryId = `${layout.activeShardId}-primary`
      const replicaNodes = nodes
        .filter((n) => n.id.startsWith(`${layout.activeShardId}-replica-`))
        .sort((a, b) => a.id.localeCompare(b.id))
      const primaryNode = nodes.find((n) => n.id === primaryId)
      const primaryHeight = getNodeMeasuredHeight(primaryNode, FALLBACK_PRIMARY_NODE_H)
      const replicaHeight =
        layout.replicaCount > 0
          ? replicaNodes.length > 0
            ? Math.max(
                ...replicaNodes.map((n) => getNodeMeasuredHeight(n, FALLBACK_REPLICA_NODE_H))
              )
            : FALLBACK_REPLICA_NODE_H
          : 0

      const updated = applyTableGroupLayoutToNode(
        node,
        layout,
        layout.activeShardId,
        tableGroups.length,
        gateway,
        primaryHeight,
        replicaHeight
      )
      if (updated) return updated
    }

    return node
  })
}

function buildTableGroupNodes({
  activeShard,
  layout,
  tableGroupCount,
  gateway,
  groupY,
  edgeStyles,
}: {
  activeShard: DiagramShard
  layout: TableGroupLayout
  tableGroupCount: number
  gateway: GatewayLayout
  groupY: number
  edgeStyles: InfrastructureDiagramEdgeStyles
}): { nodes: Node[]; edges: Edge[] } {
  const replicaCount = activeShard.replicas.length
  const hasReplicaGroup = replicaCount > 0
  const groupId = getShardGroupId(activeShard.id)
  const primaryHeight = FALLBACK_PRIMARY_NODE_H
  const containerLayout = getShardContainerLayout({
    layout,
    tableGroupCount,
    gatewayW: gateway.gatewayW,
    gatewayX: gateway.gatewayX,
    offsetX: layout.offsetX,
    primaryHeight,
    replicaHeight: FALLBACK_REPLICA_NODE_H,
    replicaCount,
  })

  const nodes: Node[] = []

  if (hasReplicaGroup && containerLayout) {
    nodes.push({
      id: groupId,
      type: 'databaseGroup',
      position: { x: containerLayout.containerX, y: groupY },
      style: { width: containerLayout.containerW, height: containerLayout.containerH },
      data: {},
      selectable: false,
      draggable: false,
    })
  }

  nodes.push({
    id: `${activeShard.id}-primary`,
    type: 'database',
    parentId: hasReplicaGroup ? groupId : undefined,
    extent: hasReplicaGroup ? 'parent' : undefined,
    position: hasReplicaGroup
      ? { x: containerLayout!.primaryX, y: containerLayout!.primaryY }
      : { x: layout.offsetX + layout.primaryX, y: groupY + layout.primaryY },
    style: { width: NODE_W },
    data: {
      label: activeShard.primary.label,
      type: 'primary',
      region: activeShard.primary.region,
      computeSize: activeShard.primary.computeSize,
      status: activeShard.primary.status,
      hasOutgoingReplicas: replicaCount > 0,
      isInReplicaGroup: hasReplicaGroup,
    },
  })

  nodes.push(
    ...activeShard.replicas.map((replica, index) => ({
      id: `${activeShard.id}-replica-${index}`,
      type: 'database' as const,
      parentId: hasReplicaGroup ? groupId : undefined,
      extent: hasReplicaGroup ? ('parent' as const) : undefined,
      position: hasReplicaGroup
        ? {
            x: containerLayout!.replicasStartX + index * (NODE_W + REPLICA_GAP),
            y: containerLayout!.replicasY,
          }
        : {
            x: layout.offsetX + layout.replicasStartX + index * (NODE_W + REPLICA_GAP),
            y: groupY + layout.replicasY,
          },
      style: { width: NODE_W },
      data: {
        label: replica.label,
        type: 'replica' as const,
        region: replica.region,
        status: replica.status,
      },
    }))
  )

  const gatewayTargetId = hasReplicaGroup ? groupId : `${activeShard.id}-primary`
  const edges: Edge[] = [
    {
      id: `gateway-${activeShard.id}`,
      source: 'multigateway',
      sourceHandle: 'bottom',
      target: gatewayTargetId,
      targetHandle: 'top',
      ...edgeStyles.dim,
    },
    ...activeShard.replicas.map((_, index) => ({
      id: `${activeShard.id}-rep-edge-${index}`,
      source: `${activeShard.id}-primary`,
      sourceHandle: 'bottom',
      target: `${activeShard.id}-replica-${index}`,
      targetHandle: 'top',
      ...edgeStyles.replica,
    })),
  ]

  return { nodes, edges }
}

export function buildInfrastructureDiagramGraph({
  config,
  activeShardByGroup,
  edgeStyles,
}: {
  config: InfrastructureMockConfig
  activeShardByGroup: Record<string, string>
  edgeStyles: InfrastructureDiagramEdgeStyles
}): { nodes: Node[]; edges: Edge[] } {
  const tableGroups = buildDiagramTableGroups(config)
  const groupY = GATEWAY_H + GATEWAY_GAP

  const layouts = buildTableGroupLayouts({
    nodes: [],
    tableGroups,
    activeShardByGroup,
    useMeasuredHeights: false,
  })

  const gateway = getGatewayLayout(layouts)

  const multigatewayNode: Node = {
    id: 'multigateway',
    type: 'multigateway',
    position: { x: gateway.gatewayX, y: 0 },
    data: {},
    style: { width: gateway.gatewayW, height: GATEWAY_H },
  }

  const nodes: Node[] = [multigatewayNode]
  const edges: Edge[] = []

  for (const layout of layouts) {
    const tableGroup = tableGroups.find((group) => group.id === layout.tableGroupId)
    if (!tableGroup) continue

    const activeShard =
      tableGroup.shards.find((shard) => shard.id === layout.activeShardId) ?? tableGroup.shards[0]
    if (!activeShard) continue

    const built = buildTableGroupNodes({
      activeShard,
      layout,
      tableGroupCount: tableGroups.length,
      gateway,
      groupY,
      edgeStyles,
    })

    nodes.push(...built.nodes)
    edges.push(...built.edges)
  }

  return { nodes, edges }
}
