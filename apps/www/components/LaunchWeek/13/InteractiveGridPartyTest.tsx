'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { SupabaseClient } from '@supabase/supabase-js'
import useConfData from '~/components/LaunchWeek/hooks/use-conf-data'
import { v4 as uuidv4 } from 'uuid'
import { useTheme } from 'next-themes'

const GRID_SIZE = 100
const CELL_SIZE = 40
const CANVAS_WIDTH = 1800
const CANVAS_HEIGHT = 1600
const HOVER_DURATION = 500
const FADE_DURATION = 400

interface CellState {
  isHovered: boolean
  fadeStartTime: number | null
  color: string
  userId: string
}

interface CursorPosition {
  x: number
  y: number
  cellX: number
  cellY: number
  lastCell: string | null
}

export const INTERACTIVE_GRID_COLORS = (isDark: boolean) => ({
  GRID_STROKE: isDark ? '#242424' : '#EDEDED',
  CURRENT_USER_HOVER: isDark ? '#242424' : '#d3d3d3',
  HOVER_COLORS: isDark
    ? ['#822A17', '#1F7A2F', '#172A82', '#520F57']
    : ['#FF8166', '#5CD671', '#6E86F7', '#F999FF'],
})

export default function InteractiveGrid() {
  const { supabase, userData } = useConfData()
  const { resolvedTheme } = useTheme()
  const isDarkTheme = resolvedTheme?.includes('dark')!
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [realtimeChannel, setRealtimeChannel] = useState<ReturnType<
    SupabaseClient['channel']
  > | null>(null)
  const [hoveredCells, setHoveredCells] = useState<Map<string, CellState>>(new Map())
  const [userCursors, setUserCursors] = useState<Record<string, CursorPosition>>({})
  const [_onlineUsers, setOnlineUsers] = useState<any[]>([])
  const [userColors, setUserColors] = useState<Record<string, string>>({})
  const animationFrameRef = useRef<number>()

  const currentUserIdRef = useRef(userData?.id || uuidv4())
  const CURRENT_USER_ID = currentUserIdRef.current

  const getUserColor = useCallback(
    (userId: string | undefined) => {
      if (!userId) {
        return INTERACTIVE_GRID_COLORS(isDarkTheme).CURRENT_USER_HOVER
      }

      if (userColors[userId]) {
        return userColors[userId]
      }

      const colors = INTERACTIVE_GRID_COLORS(isDarkTheme).HOVER_COLORS
      const color = colors[userId.charCodeAt(0) % colors.length]

      setUserColors((prev) => ({ ...prev, [userId]: color }))
      return color
    },
    [userColors, isDarkTheme]
  )

  const startCellFade = useCallback((cellKey: string) => {
    setHoveredCells((prev) => {
      const newState = new Map(prev)
      const cell = newState.get(cellKey)
      if (cell) {
        newState.set(cellKey, {
          ...cell,
          isHovered: false,
          fadeStartTime: Date.now(),
        })
      }
      return newState
    })
  }, [])

  const handleCursorMove = useCallback(
    (userId: string, position: CursorPosition) => {
      const currentCell = `${position.cellX},${position.cellY}`
      const prevCell = userCursors[userId]?.lastCell

      // Set new cell as hovered
      setHoveredCells((prev) => {
        const newState = new Map(prev)
        newState.set(currentCell, {
          isHovered: true,
          fadeStartTime: null,
          color: getUserColor(userId),
          userId,
        })
        return newState
      })

      // Start fade on previous cell if it exists
      if (prevCell && prevCell !== currentCell) {
        startCellFade(prevCell)
      }

      // Update cursor position
      setUserCursors((prev) => ({
        ...prev,
        [userId]: {
          ...position,
          lastCell: currentCell,
        },
      }))
    },
    [userCursors, getUserColor, startCellFade]
  )

  const drawGrid = useCallback(
    (ctx: CanvasRenderingContext2D, currentTime: number) => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      ctx.lineWidth = 0.2
      ctx.strokeStyle = INTERACTIVE_GRID_COLORS(isDarkTheme).GRID_STROKE

      // Draw grid cells
      for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
          const cellX = x * CELL_SIZE
          const cellY = y * CELL_SIZE
          ctx.strokeRect(cellX, cellY, CELL_SIZE, CELL_SIZE)

          const cellKey = `${x},${y}`
          const cellState = hoveredCells.get(cellKey)

          if (cellState) {
            let opacity = 0.5

            if (!cellState.isHovered && cellState.fadeStartTime) {
              const fadeElapsed = currentTime - cellState.fadeStartTime
              opacity = Math.max(0, 0.5 * (1 - fadeElapsed / FADE_DURATION))

              if (opacity <= 0) {
                setHoveredCells((prev) => {
                  const newState = new Map(prev)
                  newState.delete(cellKey)
                  return newState
                })
                continue
              }
            }

            ctx.fillStyle = `rgba(${parseInt(cellState.color.slice(1, 3), 16)}, ${parseInt(
              cellState.color.slice(3, 5),
              16
            )}, ${parseInt(cellState.color.slice(5, 7), 16)}, ${opacity})`
            ctx.fillRect(cellX, cellY, CELL_SIZE, CELL_SIZE)
          }
        }
      }

      // Draw cursors
      Object.entries(userCursors).forEach(([userId, cursor]) => {
        ctx.fillStyle =
          userId === CURRENT_USER_ID
            ? INTERACTIVE_GRID_COLORS(isDarkTheme).CURRENT_USER_HOVER
            : getUserColor(userId)
        ctx.beginPath()
        ctx.arc(cursor.x, cursor.y, 5, 0, 2 * Math.PI)
        ctx.fill()
      })
    },
    [hoveredCells, userCursors, getUserColor, isDarkTheme]
  )

  const animate = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const currentTime = Date.now()
    drawGrid(ctx, currentTime)

    animationFrameRef.current = requestAnimationFrame(animate)
  }, [drawGrid])

  useEffect(() => {
    animate()
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [animate])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const x = e.nativeEvent.offsetX
      const y = e.nativeEvent.offsetY
      const cellX = Math.floor(x / CELL_SIZE)
      const cellY = Math.floor(y / CELL_SIZE)

      if (cellX >= 0 && cellX < GRID_SIZE && cellY >= 0 && cellY < GRID_SIZE) {
        const position = {
          x,
          y,
          cellX,
          cellY,
          lastCell: userCursors[CURRENT_USER_ID]?.lastCell || null,
        }

        // Update local state
        handleCursorMove(CURRENT_USER_ID, position)

        // Broadcast position
        if (realtimeChannel) {
          realtimeChannel.send({
            type: 'broadcast',
            event: 'cursor',
            payload: {
              userId: CURRENT_USER_ID,
              position,
            },
          })
        }
      }
    },
    [realtimeChannel, handleCursorMove, userCursors]
  )

  const handleMouseLeave = useCallback(() => {
    const cursor = userCursors[CURRENT_USER_ID]
    if (cursor?.lastCell) {
      startCellFade(cursor.lastCell)
    }

    setUserCursors((prev) => {
      const newCursors = { ...prev }
      delete newCursors[CURRENT_USER_ID]
      return newCursors
    })
  }, [userCursors, startCellFade])

  useEffect(() => {
    if (!realtimeChannel && supabase) {
      const channel = supabase.channel('cursor_tracking', {
        config: { broadcast: { ack: true } },
      })

      channel
        .on('broadcast', { event: 'cursor' }, ({ payload }) => {
          // Handle cursor updates from other users
          handleCursorMove(payload.userId, payload.position)
        })
        .subscribe()

      setRealtimeChannel(channel)

      return () => {
        channel.unsubscribe()
      }
    }
  }, [supabase, handleCursorMove])

  return (
    <div className="absolute inset-0 w-full h-full flex justify-center items-center max-h-full lg:max-h-screen">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="shadow-lg"
      />
    </div>
  )
}

function onlyUnique(value: any, index: number, array: any[]) {
  return array.indexOf(value) === index
}
