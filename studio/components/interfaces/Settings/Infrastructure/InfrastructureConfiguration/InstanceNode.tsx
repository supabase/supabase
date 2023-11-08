import { Database, DatabaseBackup } from 'lucide-react'
import { Handle, NodeProps, Position } from 'reactflow'

import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconMoreVertical,
} from 'ui'
import { NODE_WIDTH } from '../Infrastructure.constants'
import dayjs from 'dayjs'
import { DATETIME_FORMAT } from 'lib/constants'

interface NodeData {
  label: string
  provider: string
  region: string
  inserted_at: string
  onSelectResizeReplica: () => void
  onSelectDropReplica: () => void
}

export const PrimaryNode = ({ data }: NodeProps<NodeData>) => {
  const { label, provider, region } = data

  return (
    <>
      <div
        className="flex rounded bg-surface-100 border border-default p-3 gap-x-3"
        style={{ width: NODE_WIDTH / 2 - 10 }}
      >
        <div className="w-8 h-8 bg-brand-500 border border-brand-600 rounded-md flex items-center justify-center">
          <Database size={16} />
        </div>
        <div className="flex flex-col gap-y-0.5">
          <p className="text-sm">{label}</p>
          <p className="flex items-center gap-x-1">
            <span className="text-xs text-foreground-light">{provider}</span>
            <span className="text-xs text-foreground-light">•</span>
            <span className="text-xs text-foreground-light">{region}</span>
          </p>
        </div>
      </div>
      <Handle
        type="source"
        id="handle-b"
        position={Position.Bottom}
        style={{ background: 'transparent' }}
      />
    </>
  )
}

export const ReplicaNode = ({ data }: NodeProps<NodeData>) => {
  const { label, provider, region, inserted_at, onSelectResizeReplica, onSelectDropReplica } = data
  const created = dayjs(inserted_at).format('DD MMM YYYY')

  return (
    <>
      <Handle
        type="target"
        id="handle-t"
        position={Position.Top}
        style={{ background: 'transparent' }}
      />
      <div
        className="flex justify-between rounded bg-surface-100 border border-default p-3"
        style={{ width: NODE_WIDTH / 2 - 10 }}
      >
        <div className="flex gap-x-3">
          <div className="w-8 h-8 bg-brand-400 border border-brand-500 rounded-md flex items-center justify-center">
            <DatabaseBackup size={16} />
          </div>
          <div className="flex flex-col gap-y-0.5">
            <div className="flex items-center gap-x-2">
              <p className="text-sm">{label}</p>
              {/* [Joshen] Some status indication perhaps */}
              <Badge color="green">Healthy</Badge>
            </div>
            <p className="flex text-xs text-foreground-light items-center gap-x-1">
              <span>{provider}</span>
              <span>•</span>
              <span>{region}</span>
            </p>
            <p className="text-xs text-foreground-light">Created: {created}</p>
          </div>
        </div>
        <div>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button type="text" icon={<IconMoreVertical />} className="px-1" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-0 w-32" side="bottom" align="end">
              <DropdownMenuItem className="gap-x-2" onClick={() => onSelectResizeReplica()}>
                Resize replica
              </DropdownMenuItem>
              <div className="border-t" />
              <DropdownMenuItem className="gap-x-2" onClick={() => onSelectDropReplica()}>
                Drop replica
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  )
}
