import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Network } from 'lucide-react'

import { diagramHandleClassName } from '../diagramHandleClassName'

export const MultigatewayNode = (_props: NodeProps) => {
  return (
    <div className="h-full w-full">
      <div className="h-full rounded-sm border border-default bg-surface-100 px-2.5 py-1.5">
        <div className="flex h-full items-center gap-x-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-default bg-surface-200 text-foreground-light">
            <Network size={16} strokeWidth={1.5} />
          </div>
          <div className="text-sm flex min-w-0 flex-col gap-y-0.5 whitespace-nowrap">
            <p>Multigateway</p>
            <p className="text-foreground-light">Load balancer</p>
          </div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className={diagramHandleClassName}
      />
    </div>
  )
}
