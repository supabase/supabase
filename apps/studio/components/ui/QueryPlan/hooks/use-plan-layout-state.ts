import { useMemo, useState, useRef, useCallback, useEffect, type SetStateAction } from 'react'
import type {
  Node,
  NodeChange,
  OnSelectionChangeParams,
  ReactFlowInstance,
  XYPosition,
} from 'reactflow'

import { DEFAULT_NODE_HEIGHT, DEFAULT_NODE_WIDTH } from '../constants'
import type { PlanNodeData } from '../types'

export type UsePlanLayoutStateParams = {
  layoutNodes: Node<PlanNodeData>[]
  isExpanded: boolean
  setIsExpanded: (value: SetStateAction<boolean>) => void
}

const centerNodeInView = (nodeId: string, rfInstance: ReactFlowInstance) => {
  if (!rfInstance) return

  const node = rfInstance.getNode(nodeId)
  if (!node) return

  const position = node.positionAbsolute ?? node.position
  const nodeWidth = node.width ?? DEFAULT_NODE_WIDTH
  const nodeHeight = node.height ?? DEFAULT_NODE_HEIGHT
  const centerX = position.x + nodeWidth / 2
  const centerY = position.y + nodeHeight / 2

  const currentZoom = rfInstance.getZoom()
  const targetZoom = currentZoom < 1 ? 1 : currentZoom

  rfInstance.setCenter(centerX, centerY, {
    zoom: targetZoom,
    duration: 400,
  })
}

export const usePlanLayoutState = ({
  layoutNodes,
  isExpanded,
  setIsExpanded,
}: UsePlanLayoutStateParams) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null)
  const [panelNode, setPanelNode] = useState<Node<PlanNodeData> | null>(null)
  const [nodePositionOverrides, setNodePositionOverrides] = useState<Record<string, XYPosition>>({})
  const selectionSuppressedRef = useRef(false)
  const draggingNodeRef = useRef(false)

  useEffect(() => {
    if (!isExpanded || !rfInstance) return

    let frameId: number | null = null
    let secondFrameId: number | null = null

    frameId = requestAnimationFrame(() => {
      secondFrameId = requestAnimationFrame(() => {
        rfInstance.fitView()
      })
    })

    return () => {
      if (frameId) cancelAnimationFrame(frameId)
      if (secondFrameId) cancelAnimationFrame(secondFrameId)
    }
  }, [isExpanded, rfInstance])

  const handleSelectNode = useCallback((node: Node<PlanNodeData>) => {
    setSelectedNodeId(node.id)
  }, [])

  const handleSelectionChange = useCallback(({ nodes }: OnSelectionChangeParams) => {
    if (selectionSuppressedRef.current) return

    if (nodes.length === 0) {
      setSelectedNodeId(null)
      return
    }

    const last = nodes[nodes.length - 1]
    setSelectedNodeId(last.id)
  }, [])

  useEffect(() => {
    if (!selectedNodeId) return

    const match = layoutNodes.find((node) => node.id === selectedNodeId)
    if (!match) {
      setSelectedNodeId(null)
    }
  }, [layoutNodes, selectedNodeId])

  useEffect(() => {
    setNodePositionOverrides((prev) => {
      const validIds = new Set(layoutNodes.map((node) => node.id))
      let changed = false
      const next: Record<string, XYPosition> = {}

      for (const id of Object.keys(prev)) {
        if (validIds.has(id)) {
          next[id] = prev[id]
        } else {
          changed = true
        }
      }

      return changed ? next : prev
    })
  }, [layoutNodes])

  const nodesWithSelection = useMemo(
    () =>
      layoutNodes.map((node) => {
        const override = nodePositionOverrides[node.id]
        const overrideProps = override
          ? {
              position: override,
              positionAbsolute: override,
            }
          : {}
        return {
          ...node,
          ...overrideProps,
          selected: node.id === selectedNodeId,
        }
      }),
    [layoutNodes, nodePositionOverrides, selectedNodeId]
  )

  const selectedNode = useMemo(
    () => layoutNodes.find((node) => node.id === selectedNodeId) ?? null,
    [layoutNodes, selectedNodeId]
  )

  useEffect(() => {
    if (selectedNode) {
      setPanelNode(selectedNode)
    }
  }, [selectedNode])

  useEffect(() => {
    if (!selectedNodeId || !rfInstance) return

    let frameId: number | null = null
    let secondFrameId: number | null = null

    frameId = requestAnimationFrame(() => {
      secondFrameId = requestAnimationFrame(() => {
        centerNodeInView(selectedNodeId, rfInstance)
      })
    })

    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId)
      if (secondFrameId !== null) cancelAnimationFrame(secondFrameId)
    }
  }, [centerNodeInView, rfInstance, selectedNodeId])

  useEffect(() => {
    if (!isExpanded || typeof document === 'undefined') return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isExpanded])

  useEffect(() => {
    if (!isExpanded) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return

      event.stopPropagation()
      event.preventDefault()

      setIsExpanded(false)
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [isExpanded, setIsExpanded])

  const clearSelection = useCallback(() => {
    if (draggingNodeRef.current) return

    setSelectedNodeId(null)
  }, [])

  const handleNodeDragStart = useCallback((_event: unknown, _node: Node<PlanNodeData>) => {
    selectionSuppressedRef.current = true
    draggingNodeRef.current = true
  }, [])

  const handleNodeDragStop = useCallback((_event: unknown, node: Node<PlanNodeData>) => {
    const release = () => {
      selectionSuppressedRef.current = false
      draggingNodeRef.current = false
    }

    setNodePositionOverrides((prev) => {
      const position = node.position ?? node.positionAbsolute
      if (!position) return prev

      const current = prev[node.id]
      if (current && current.x === position.x && current.y === position.y) {
        return prev
      }

      return { ...prev, [node.id]: position }
    })

    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(release)
    } else {
      release()
    }
  }, [])

  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    setNodePositionOverrides((prev) => {
      let next = prev

      changes.forEach((change) => {
        if (change.type !== 'position' || !change.position) return

        const existing = prev[change.id]
        if (existing && existing.x === change.position.x && existing.y === change.position.y) {
          return
        }

        if (next === prev) {
          next = { ...prev }
        }

        next[change.id] = change.position
      })

      return next
    })
  }, [])

  const handleDetailPanelAfterLeave = useCallback(() => {
    if (!selectedNode) {
      setPanelNode(null)
    }
  }, [selectedNode])

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev: boolean) => !prev)
  }, [setIsExpanded])

  return {
    selectedNodeId,
    selectedNode,
    panelNode,
    nodesWithSelection,
    setRfInstance,
    clearSelection,
    handleSelectNode,
    handleSelectionChange,
    handleNodesChange,
    handleNodeDragStart,
    handleNodeDragStop,
    handleDetailPanelAfterLeave,
    toggleExpanded,
  }
}
