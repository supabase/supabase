import { Handle, Position, type NodeProps } from '@xyflow/react'

import { diagramHandleClassName } from '../diagramHandleClassName'

export const DatabaseGroupNode = (_props: NodeProps) => {
  return (
    <div className="h-full w-full rounded-sm border border-default bg-surface-100/20">
      <Handle type="target" position={Position.Top} id="top" className={diagramHandleClassName} />
    </div>
  )
}
