import { Handle, Position, NodeProps } from 'reactflow'
import { memo } from 'react'
import {
  Table,
  Eye,
  Layers,
  Zap,
  Shield,
  List,
  Hash,
  Box,
  FunctionSquare,
} from 'lucide-react'
import { cn } from 'ui'
import type { SchemaGraphNodeData } from './types'
import { NODE_TYPE_COLORS, NODE_TYPE_LABELS } from './types'

const NODE_TYPE_ICONS: Record<string, typeof Table> = {
  table: Table,
  view: Eye,
  materialized_view: Layers,
  function: FunctionSquare,
  trigger: Zap,
  policy: Shield,
  index: List,
  sequence: Hash,
  type: Box,
}

function SchemaGraphNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as SchemaGraphNodeData
  const Icon = NODE_TYPE_ICONS[nodeData.type] || Table
  const color = NODE_TYPE_COLORS[nodeData.type]
  const label = NODE_TYPE_LABELS[nodeData.type]

  return (
    <div
      className={cn(
        'px-3 py-2 rounded-lg border-2 bg-surface-100 min-w-[140px] max-w-[240px] transition-all duration-200',
        selected && 'ring-2 ring-offset-2 ring-offset-background',
        nodeData.highlighted && 'ring-2 ring-brand-500 shadow-lg scale-105',
        nodeData.dimmed && 'opacity-30'
      )}
      style={{ borderColor: color }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-border-strong !w-2 !h-2"
      />

      <div className="flex items-start gap-2">
        <div
          className="p-1 rounded mt-0.5"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon size={14} style={{ color }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-xs text-foreground-light truncate">{nodeData.schema}</div>
          <div className="text-sm font-medium text-foreground truncate" title={nodeData.name}>
            {nodeData.name}
          </div>
          <div className="text-xs text-foreground-muted">{label}</div>
        </div>
      </div>

      {nodeData.comment && (
        <div className="mt-1 text-xs text-foreground-light truncate" title={nodeData.comment}>
          {nodeData.comment}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!bg-border-strong !w-2 !h-2"
      />
    </div>
  )
}

export const SchemaGraphNode = memo(SchemaGraphNodeComponent)
