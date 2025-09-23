import { useMemo, useState, useRef, useCallback, useEffect, type SetStateAction } from 'react'
import type { Node, ReactFlowInstance, OnSelectionChangeParams } from 'reactflow'

import { DEFAULT_NODE_HEIGHT, DEFAULT_NODE_WIDTH } from '../constants'
import type { PlanNodeData } from '../types'

export type UsePlanLayoutStateParams = {
  layoutNodes: Node<PlanNodeData>[]
  isExpanded: boolean
  setIsExpanded: (value: SetStateAction<boolean>) => void
}

export const usePlanLayoutState = ({
  layoutNodes,
  isExpanded,
  setIsExpanded,
}: UsePlanLayoutStateParams) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null)
  const [panelNode, setPanelNode] = useState<Node<PlanNodeData> | null>(null)
  const selectionSuppressedRef = useRef(false)

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

  const centerNodeInView = useCallback(
    (nodeId: string) => {
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
    },
    [rfInstance]
  )

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

  const nodesWithSelection = useMemo(
    () =>
      layoutNodes.map((node) => ({
        ...node,
        selected: node.id === selectedNodeId,
      })),
    [layoutNodes, selectedNodeId]
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
        centerNodeInView(selectedNodeId)
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
    setSelectedNodeId(null)
  }, [])

  const handleNodeDragStart = useCallback(
    (_event: unknown, _node: Node<PlanNodeData>) => {
      selectionSuppressedRef.current = true
      clearSelection()
    },
    [clearSelection]
  )

  const handleNodeDragStop = useCallback(
    (_event: unknown, node: Node<PlanNodeData>) => {
      if (rfInstance) {
        rfInstance.setNodes((nodes) =>
          nodes.map((current) =>
            current.id === node.id ? { ...current, selected: false } : current
          )
        )
      }

      const release = () => {
        selectionSuppressedRef.current = false
      }

      if (typeof window !== 'undefined') {
        window.requestAnimationFrame(release)
      } else {
        release()
      }
    },
    [rfInstance]
  )

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
    handleNodeDragStart,
    handleNodeDragStop,
    handleDetailPanelAfterLeave,
    toggleExpanded,
  }
}
