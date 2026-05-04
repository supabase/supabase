import {
  BaseEdge,
  Edge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
  Position,
  useReactFlow,
} from '@xyflow/react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Badge, cn } from 'ui'

import { useSchemaGraphContext } from './SchemaGraphContext'
import { EdgeData } from './Schemas.constants'
import { useQuerySchemaState } from '@/hooks/misc/useSchemaQueryState'
import { useStaticEffectEvent } from '@/hooks/useStaticEffectEvent'

export const DefaultEdge = ({
  id,
  animated,
  data,
  deletable,
  selectable,
  source,
  sourceX,
  sourceY,
  sourceHandleId,
  sourcePosition = Position.Bottom,
  target,
  targetX,
  targetY,
  targetHandleId,
  targetPosition = Position.Top,
  selected,
  pathOptions,
  ...props
}: EdgeProps<Edge<EdgeData>>) => {
  const { isDownloading } = useSchemaGraphContext()
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: pathOptions?.borderRadius,
    offset: pathOptions?.offset,
    stepPosition: pathOptions?.stepPosition,
  })
  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        className={cn(selected ? 'stroke-brand!' : isDownloading ? 'stroke-black!' : undefined)}
        stroke="#000000"
        {...props}
      />
      {data && selected ? (
        <EdgeRelationInfo
          source={source}
          target={target}
          edgePath={edgePath}
          labelX={labelX}
          labelY={labelY}
          sourceX={sourceX}
          targetX={targetX}
          data={data}
        />
      ) : null}
    </>
  )
}

const EdgeRelationInfo = ({
  data,
  source,
  target,
  labelX,
  labelY,
  targetX,
  sourceX,
}: {
  data: EdgeData
  edgePath: string
  source: string
  target: string
  labelX: number
  labelY: number
  sourceX: number
  targetX: number
}) => {
  const [show, setShow] = useState(false)
  const reactFlowInstance = useReactFlow()

  const checkIfShouldBeDisplayed = useStaticEffectEvent(
    (relationInfoElement: HTMLDivElement | null) => {
      if (!relationInfoElement) return
      const sourceNode = reactFlowInstance.getNode(source)
      const targetNode = reactFlowInstance.getNode(target)
      if (!sourceNode || !targetNode) return

      const relationInfoRect = relationInfoElement.getBoundingClientRect()
      // Get the origin position of the relation information badge in the ReactFlow coordinates
      const relationInfoOriginPositionInReactFlow = reactFlowInstance.screenToFlowPosition({
        x: relationInfoRect.x,
        y: relationInfoRect.y,
      })
      // Get the end position (origin + dimensions) of the relation information badge in the ReactFlow coordinates
      const relationInfoTargetPositionInReactFlow = reactFlowInstance.screenToFlowPosition({
        x: relationInfoRect.x + relationInfoRect.width,
        y: relationInfoRect.y + relationInfoRect.height,
      })
      // Create a ReactFlow Rect from the computed position above
      const relationInfoReactFlowRect = {
        x: relationInfoOriginPositionInReactFlow.x,
        y: relationInfoOriginPositionInReactFlow.y,
        width: relationInfoTargetPositionInReactFlow.x - relationInfoOriginPositionInReactFlow.x,
        height: relationInfoTargetPositionInReactFlow.y - relationInfoOriginPositionInReactFlow.y,
      }
      // Check whether the relation information badge is intersecting with either the source or target node
      const isNodeIntersectingWithSource = reactFlowInstance.isNodeIntersecting(
        sourceNode,
        relationInfoReactFlowRect
      )
      const isNodeIntersectingWithTarget = reactFlowInstance.isNodeIntersecting(
        targetNode,
        relationInfoReactFlowRect
      )

      // If it is, hide it as they are too close
      setShow(!isNodeIntersectingWithSource && !isNodeIntersectingWithTarget)
    }
  )

  return (
    <EdgeLabelRenderer>
      <Badge
        ref={checkIfShouldBeDisplayed}
        className={cn(
          'absolute pointer-events-auto z-50 p-1 rounded-[4px] gap-1 outline outline-1 outline-brand',
          show ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
        }}
      >
        {
          // Show the columns in the order of the schema instead of the Postgre relation order
          sourceX < targetX ? (
            <>
              <EdgeNodeData
                schema={data.sourceSchemaName}
                table={data.sourceName}
                column={data.sourceColumnName}
              />
              <ArrowRight size={12} />
              <EdgeNodeData
                schema={data.targetSchemaName}
                table={data.targetName}
                column={data.targetColumnName}
              />
            </>
          ) : (
            <>
              <EdgeNodeData
                schema={data.targetSchemaName}
                table={data.targetName}
                column={data.targetColumnName}
              />
              <ArrowLeft size={12} />
              <EdgeNodeData
                schema={data.sourceSchemaName}
                table={data.sourceName}
                column={data.sourceColumnName}
              />
            </>
          )
        }
      </Badge>
    </EdgeLabelRenderer>
  )
}

const EdgeNodeData = ({
  schema,
  table,
  column,
}: {
  schema: string
  table: string
  column: string
}) => {
  const { selectedSchema } = useQuerySchemaState()

  return (
    <Badge className="normal-case text-[8px]">
      {selectedSchema === schema ? '' : `${schema}.`}
      {table}.{column}
    </Badge>
  )
}
