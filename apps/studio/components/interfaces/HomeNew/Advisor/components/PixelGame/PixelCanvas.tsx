import { useEffect, useRef, useState, useCallback } from 'react'
import type { Block, ViewState } from './types'
import { useTheme } from 'next-themes'

type CursorData = {
  position: { x: number; y: number }
  user: { id: number; name: string }
  color: string
}

interface PixelCanvasProps {
  blocks: Block[]
  onPlaceBlock: (x: number, y: number, z: number) => void
  onRemoveBlock: (x: number, y: number, z: number) => void
  canPlaceBlock: (x: number, y: number, z: number) => boolean
  cursors?: Record<string, CursorData>
  onViewStateChange?: (viewState: ViewState) => void
  onMouseMove?: (canvasX: number, canvasY: number) => void
  canvasRef?: React.MutableRefObject<HTMLCanvasElement | null>
}

export const PixelCanvas = ({
  blocks,
  onPlaceBlock,
  onRemoveBlock,
  canPlaceBlock,
  cursors = {},
  onViewStateChange,
  onMouseMove,
  canvasRef: externalCanvasRef,
}: PixelCanvasProps) => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const internalCanvasRef = useRef<HTMLCanvasElement>(null)
  const [viewState, setViewState] = useState<ViewState>({
    offsetX: 0,
    offsetY: 0,
    scale: 2,
  })

  // Callback ref to set both internal and external refs
  const setCanvasRef = useCallback(
    (node: HTMLCanvasElement | null) => {
      internalCanvasRef.current = node
      if (externalCanvasRef) {
        externalCanvasRef.current = node
      }
    },
    [externalCanvasRef]
  )

  const canvasRef = internalCanvasRef
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [hasDragged, setHasDragged] = useState(false)
  const [hoveredCell, setHoveredCell] = useState<[number, number, number] | null>(null)

  const CELL_SIZE = 4
  const GRID_COLOR = isDark ? '#333' : '#ddd'
  const BG_COLOR = isDark ? '#111' : '#f5f5f5'
  const MIN_SCALE = 0.1
  const MAX_SCALE = 10

  const getBlocksAtPosition = useCallback(
    (x: number, y: number): Block[] => {
      return blocks
        .filter((block) => block.position[0] === x && block.position[1] === y)
        .sort((a, b) => a.position[2] - b.position[2])
    },
    [blocks]
  )

  const getTopBlockZ = useCallback(
    (x: number, y: number): number => {
      const blocksAtPos = getBlocksAtPosition(x, y)
      return blocksAtPos.length > 0 ? blocksAtPos[blocksAtPos.length - 1].position[2] : -1
    },
    [getBlocksAtPosition]
  )

  const screenToGrid = useCallback(
    (screenX: number, screenY: number): [number, number] => {
      const canvas = canvasRef.current
      if (!canvas) return [0, 0]

      const rect = canvas.getBoundingClientRect()
      const x =
        (screenX - rect.left - canvas.width / 2 - viewState.offsetX) / (CELL_SIZE * viewState.scale)
      const y =
        (screenY - rect.top - canvas.height / 2 - viewState.offsetY) / (CELL_SIZE * viewState.scale)

      return [Math.floor(x), Math.floor(y)]
    },
    [viewState]
  )

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const width = canvas.width
    const height = canvas.height

    // Clear canvas
    ctx.fillStyle = BG_COLOR
    ctx.fillRect(0, 0, width, height)

    ctx.save()
    ctx.translate(width / 2 + viewState.offsetX, height / 2 + viewState.offsetY)
    ctx.scale(viewState.scale, viewState.scale)

    // Calculate visible grid bounds
    const visibleLeft =
      Math.floor((-width / 2 - viewState.offsetX) / (CELL_SIZE * viewState.scale)) - 1
    const visibleRight =
      Math.ceil((width / 2 - viewState.offsetX) / (CELL_SIZE * viewState.scale)) + 1
    const visibleTop =
      Math.floor((-height / 2 - viewState.offsetY) / (CELL_SIZE * viewState.scale)) - 1
    const visibleBottom =
      Math.ceil((height / 2 - viewState.offsetY) / (CELL_SIZE * viewState.scale)) + 1

    // Draw grid lines
    ctx.strokeStyle = GRID_COLOR
    ctx.lineWidth = 0.1

    for (let x = visibleLeft; x <= visibleRight; x++) {
      ctx.beginPath()
      ctx.moveTo(x * CELL_SIZE, visibleTop * CELL_SIZE)
      ctx.lineTo(x * CELL_SIZE, visibleBottom * CELL_SIZE)
      ctx.stroke()
    }

    for (let y = visibleTop; y <= visibleBottom; y++) {
      ctx.beginPath()
      ctx.moveTo(visibleLeft * CELL_SIZE, y * CELL_SIZE)
      ctx.lineTo(visibleRight * CELL_SIZE, y * CELL_SIZE)
      ctx.stroke()
    }

    // Draw blocks
    blocks.forEach((block) => {
      const [x, y, z] = block.position

      // Use the texture color if it's a hex color, otherwise use grayscale
      const isHexColor = /^#[0-9A-F]{6}$/i.test(block.texture)

      if (isHexColor) {
        // Parse hex color and adjust brightness based on z
        const r = parseInt(block.texture.slice(1, 3), 16)
        const g = parseInt(block.texture.slice(3, 5), 16)
        const b = parseInt(block.texture.slice(5, 7), 16)

        // Add brightness based on z-level (0-20%)
        const brightnessFactor = 1 + z * 0.1
        const adjustedR = Math.min(255, Math.floor(r * brightnessFactor))
        const adjustedG = Math.min(255, Math.floor(g * brightnessFactor))
        const adjustedB = Math.min(255, Math.floor(b * brightnessFactor))

        ctx.fillStyle = `rgb(${adjustedR}, ${adjustedG}, ${adjustedB})`
      } else {
        // Fallback to grayscale for legacy blocks
        const lightness = Math.min(30 + z * 10, 90)
        ctx.fillStyle = `hsl(0, 0%, ${lightness}%)`
      }

      ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
    })

    // Draw hovered cell
    if (hoveredCell) {
      const [x, y, z] = hoveredCell
      const canPlace = canPlaceBlock(x, y, z)

      ctx.fillStyle = canPlace ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 0, 0, 0.2)'
      ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
    }

    ctx.restore()

    // Draw cursors (outside the transformed context)
    Object.values(cursors).forEach((cursor) => {
      const { position, color, user } = cursor

      // Convert canvas-relative position to screen position
      const screenX = width / 2 + viewState.offsetX + position.x * viewState.scale
      const screenY = height / 2 + viewState.offsetY + position.y * viewState.scale

      // Scale cursor based on zoom (but don't let it get too small)
      const cursorScale = Math.max(0.5, Math.min(2, viewState.scale))
      const cursorSize = 30 * cursorScale

      // Draw cursor arrow (simplified version)
      ctx.save()
      ctx.translate(screenX, screenY)
      ctx.scale(cursorScale, cursorScale)

      // Draw cursor pointer shape
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(0, 20)
      ctx.lineTo(5, 15)
      ctx.lineTo(10, 25)
      ctx.lineTo(13, 22)
      ctx.lineTo(8, 12)
      ctx.lineTo(15, 10)
      ctx.closePath()
      ctx.fill()

      // Draw outline
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Draw name label
      ctx.fillStyle = color
      const nameText = user.name
      ctx.font = '12px Inter, sans-serif'
      const textWidth = ctx.measureText(nameText).width
      const padding = 4

      ctx.fillRect(18, 2, textWidth + padding * 2, 18)
      ctx.fillStyle = 'white'
      ctx.fillText(nameText, 18 + padding, 14)

      ctx.restore()
    })
  }, [viewState, blocks, hoveredCell, canPlaceBlock, cursors])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      draw()
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    return () => window.removeEventListener('resize', resizeCanvas)
  }, [draw])

  useEffect(() => {
    draw()
  }, [draw])

  useEffect(() => {
    if (onViewStateChange) {
      onViewStateChange(viewState)
    }
  }, [viewState, onViewStateChange])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setHasDragged(false)
    setDragStart({ x: e.clientX - viewState.offsetX, y: e.clientY - viewState.offsetY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const canvasX = e.clientX - rect.left
    const canvasY = e.clientY - rect.top

    // Report canvas-relative position for cursor broadcasting
    if (onMouseMove) {
      onMouseMove(canvasX, canvasY)
    }

    const [gridX, gridY] = screenToGrid(e.clientX, e.clientY)
    const topZ = getTopBlockZ(gridX, gridY)
    const nextZ = topZ + 1

    setHoveredCell([gridX, gridY, nextZ])

    if (isDragging) {
      setHasDragged(true)
      setViewState((prev) => ({
        ...prev,
        offsetX: e.clientX - dragStart.x,
        offsetY: e.clientY - dragStart.y,
      }))
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
    setHoveredCell(null)
  }

  const handleClick = (e: React.MouseEvent) => {
    // Don't place block if user was dragging
    if (hasDragged) return
    if (!hoveredCell) return

    const [x, y, z] = hoveredCell

    // Alt+click to remove block
    if (e.altKey) {
      // Check if there's a block at this position
      const blockExists = blocks.some(
        (block) => block.position[0] === x && block.position[1] === y && block.position[2] === z
      )
      if (blockExists) {
        onRemoveBlock(x, y, z)
      }
    } else {
      // Normal click to place block
      if (canPlaceBlock(x, y, z)) {
        onPlaceBlock(x, y, z)
      }
    }
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, viewState.scale * delta))

    // Calculate the world position before zoom
    const worldX = (mouseX - canvas.width / 2 - viewState.offsetX) / viewState.scale
    const worldY = (mouseY - canvas.height / 2 - viewState.offsetY) / viewState.scale

    // Calculate new offset to keep the same world position under the mouse
    const newOffsetX = mouseX - canvas.width / 2 - worldX * newScale
    const newOffsetY = mouseY - canvas.height / 2 - worldY * newScale

    setViewState({
      offsetX: newOffsetX,
      offsetY: newOffsetY,
      scale: newScale,
    })
  }

  return (
    <canvas
      ref={setCanvasRef}
      className="w-full h-full cursor-move"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onWheel={handleWheel}
    />
  )
}
