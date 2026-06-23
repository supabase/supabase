import { Handle, Position, type NodeProps } from '@xyflow/react'

import { diagramHandleClassName } from '../diagramHandleClassName'
import { BASE_PATH } from '@/lib/constants'

type DatabaseNodeData = {
  label: string
  type: 'primary' | 'replica'
  region: string
  computeSize?: string
  status: 'healthy' | 'warning' | 'error'
  hasOutgoingReplicas?: boolean
  isInReplicaGroup?: boolean
}

export const DatabaseNode = ({ data }: NodeProps) => {
  const nodeData = data as unknown as DatabaseNodeData
  const isPrimary = nodeData.type === 'primary'

  return (
    <div className="w-full">
      <div className="rounded-sm border border-default bg-surface-100">
        <div className="p-2.5 text-sm flex w-full flex-col gap-y-0.5">
          <p>{nodeData.label}</p>
          <p className="flex items-center gap-x-1.5 text-foreground-light">
            <img
              alt=""
              className="w-4 shrink-0 rounded-xs"
              src={`${BASE_PATH}/img/regions/${nodeData.region}.svg`}
            />
            <span>{nodeData.region}</span>
          </p>
          {isPrimary && nodeData.computeSize && (
            <p className="break-words text-xs text-foreground-lighter">{nodeData.computeSize}</p>
          )}
        </div>
      </div>

      {!nodeData.isInReplicaGroup && (
        <Handle type="target" position={Position.Top} id="top" className={diagramHandleClassName} />
      )}
      {isPrimary && nodeData.hasOutgoingReplicas && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          className={diagramHandleClassName}
        />
      )}
    </div>
  )
}
